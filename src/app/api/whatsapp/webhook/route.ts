/**
 * Webhook do WhatsApp — coração do ZapVago.
 *
 * GET  — verificação do webhook durante o setup do provedor (Meta/360dialog).
 * POST — recebe mensagens do cliente, monta o contexto (Prontuário Inteligente),
 *        chama o Claude com o prompt de sistema, executa a ação retornada
 *        (agendar, remarcar, cancelar, transferir, entrar na lista de espera)
 *        e responde no WhatsApp. Também atualiza sentimento da conversa
 *        (Painel de Sentimentos) e aplica Modo Silencioso quando necessário.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhook, sendWhatsAppMessage, normalizePhone } from "@/lib/whatsapp";
import { askClaude } from "@/lib/claude";
import { buildSystemPrompt } from "@/lib/prompt";
import { visitsUntilNextReward, checkLoyaltyReward } from "@/lib/loyalty";
import { calculateNoShowRisk } from "@/lib/noshow";
import { checkDailyNegativeAlert } from "@/lib/sentiment-alerts";
import { scheduleReminders } from "@/lib/queue";
import { addMinutes } from "date-fns";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challenge = verifyWebhook(
    searchParams.get("hub.mode"),
    searchParams.get("hub.verify_token"),
    searchParams.get("hub.challenge")
  );
  if (challenge) return new NextResponse(challenge, { status: 200 });
  return NextResponse.json({ error: "Verificação falhou." }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Formato do payload segue o padrão da WhatsApp Cloud API.
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];
    if (!message) return NextResponse.json({ ok: true }); // status update, ignorar

    const fromPhone = normalizePhone(message.from);
    const text: string = message.text?.body ?? "";
    // O número de destino (businessPhoneNumberId) identifica QUAL negócio recebeu a mensagem.
    const businessPhoneNumberId = change.metadata?.phone_number_id;

    const business = await prisma.business.findFirst({
      where: { whatsappProviderConfig: { path: ["phoneNumberId"], equals: businessPhoneNumberId } },
    });
    if (!business) {
      console.error("[webhook] Negócio não encontrado para phone_number_id:", businessPhoneNumberId);
      return NextResponse.json({ ok: true });
    }

    await handleIncomingMessage(business.id, fromPhone, text);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[whatsapp/webhook] erro:", err);
    return NextResponse.json({ ok: true }); // sempre 200 para o provedor não reenviar em loop
  }
}

async function handleIncomingMessage(businessId: string, clientPhone: string, text: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return;

  let client = await prisma.client.findUnique({ where: { businessId_phone: { businessId, phone: clientPhone } } });

  // Modo Silencioso: cliente silenciado não recebe ofertas proativas, mas ainda pode agendar.
  const isSilenced = client?.silencedUntil && client.silencedUntil > new Date();

  let conversation = await prisma.conversation.findFirst({
    where: { businessId, clientPhone, status: { in: ["BOT_HANDLING", "NEEDS_HUMAN"] } },
    orderBy: { updatedAt: "desc" },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { businessId, clientPhone, clientId: client?.id, clientName: client?.name, messages: [] },
    });
  }

  const history = (conversation.messages as any[]) ?? [];

  // Se a conversa já está com um humano, não deixamos o bot responder automaticamente.
  if (conversation.status === "HUMAN_HANDLING") {
    const updatedMessages = [...history, { role: "client", content: text, timestamp: new Date().toISOString() }];
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { messages: updatedMessages, needsAttention: true },
    });
    return;
  }

  const [services, professionals] = await Promise.all([
    prisma.service.findMany({ where: { businessId, active: true } }),
    prisma.professional.findMany({ where: { businessId, active: true } }),
  ]);

  const visitsForNextReward = client ? await visitsUntilNextReward(businessId, client.loyaltyPoints) : null;

  const systemPrompt = buildSystemPrompt({ business, services, professionals, client, visitsForNextReward });
  const botResult = await askClaude(systemPrompt, text, history);

  // Persiste a conversa com sentimento classificado pelo Claude (Diferencial 4 — Painel de Sentimentos)
  const updatedMessages = [
    ...history,
    { role: "client", content: text, timestamp: new Date().toISOString(), sentiment: botResult.sentiment },
    { role: "bot", content: botResult.response, timestamp: new Date().toISOString() },
  ];

  const needsAttention = botResult.action === "transfer_to_human" || botResult.sentiment === "negative";

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      messages: updatedMessages,
      sentiment: botResult.sentiment,
      language: botResult.language,
      status: botResult.action === "transfer_to_human" ? "NEEDS_HUMAN" : "BOT_HANDLING",
      needsAttention,
      clientId: client?.id,
      clientName: client?.name,
    },
  });

  if (botResult.sentiment === "negative") await checkDailyNegativeAlert(businessId);

  // Executa a ação decidida pelo Claude
  await executeAction(businessId, client, clientPhone, botResult);

  // Sempre responde ao cliente pelo WhatsApp (a menos que só tenha transferido silenciosamente)
  await sendWhatsAppMessage(clientPhone, botResult.response);
}

async function executeAction(businessId: string, client: any, clientPhone: string, botResult: any) {
  const data = botResult.data ?? {};

  switch (botResult.action) {
    case "schedule": {
      if (!data.serviceId || !data.professionalId || !data.date || !data.time) return;

      let existingClient = client;
      if (!existingClient) {
        existingClient = await prisma.client.create({
          data: { businessId, name: data.clientName ?? "Cliente WhatsApp", phone: clientPhone, tags: ["novo"] },
        });
      }

      const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
      if (!service) return;

      const startDate = new Date(`${data.date}T${data.time}:00`);
      const endTime = addMinutes(startDate, service.duration);

      const conflict = await prisma.appointment.findFirst({
        where: {
          professionalId: data.professionalId,
          status: { in: ["CONFIRMED", "PENDING_CONFIRMATION"] },
          AND: [{ date: { lt: endTime } }, { endTime: { gt: startDate } }],
        },
      });
      if (conflict) return; // Claude deveria ter oferecido apenas horários livres

      const noShowPredicted = calculateNoShowRisk({
        client: existingClient,
        clientConfirmed: false,
      });

      const appointment = await prisma.appointment.create({
        data: {
          businessId,
          clientId: existingClient.id,
          serviceId: data.serviceId,
          professionalId: data.professionalId,
          date: startDate,
          endTime,
          source: "WHATSAPP",
          noShowPredicted,
          upsellOffered: !!service.comboOf?.length,
        },
      });
      await scheduleReminders(appointment.id, startDate);

      // Diferencial 10 — Fidelidade: verifica se o cliente atingiu recompensa
      const reward = await checkLoyaltyReward(businessId, existingClient.loyaltyPoints + 1);
      if (reward) {
        await sendWhatsAppMessage(
          clientPhone,
          `🎉 Parabéns! Você atingiu ${reward.visitsRequired} visitas e ganhou uma recompensa especial no seu próximo atendimento!`
        );
      }
      break;
    }
    case "reschedule": {
      if (!data.appointmentId) return;
      const appt = await prisma.appointment.findFirst({ where: { id: data.appointmentId, businessId }, include: { service: true } });
      if (!appt) return;
      const newDate = data.newDate && data.newTime ? new Date(`${data.newDate}T${data.newTime}:00`) : appt.date;
      await prisma.appointment.update({
        where: { id: data.appointmentId },
        data: { date: newDate, endTime: addMinutes(newDate, appt.service.duration) },
      });
      await scheduleReminders(data.appointmentId, newDate);
      break;
    }
    case "cancel": {
      if (!data.appointmentId) return;
      const { offerSlotToWaitingList } = await import("@/lib/waiting-list");
      await prisma.appointment.updateMany({ where: { id: data.appointmentId, businessId }, data: { status: "CANCELLED" } });
      await offerSlotToWaitingList(data.appointmentId);
      break;
    }
    case "add_to_waiting_list": {
      if (!client || !data.serviceId || !data.preferredDate) return;
      await prisma.waitingListEntry.create({
        data: {
          businessId,
          clientId: client.id,
          serviceId: data.serviceId,
          preferredDate: new Date(data.preferredDate),
          preferredPeriod: data.preferredPeriod,
        },
      });
      break;
    }
    case "transfer_to_human":
    case "reply":
    default:
      break;
  }
}
