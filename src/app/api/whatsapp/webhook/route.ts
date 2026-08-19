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
import { verifyWebhook, verifyPayloadSignature, sendWhatsAppMessage, normalizePhone } from "@/lib/whatsapp";
import { askClaude } from "@/lib/claude";
import { buildSystemPrompt } from "@/lib/prompt";
import { visitsUntilNextReward, checkLoyaltyReward, tryRedeemLoyaltyReward } from "@/lib/loyalty";
import { calculateNoShowRisk } from "@/lib/noshow";
import { checkDailyNegativeAlert } from "@/lib/sentiment-alerts";
import { scheduleReminders } from "@/lib/queue";
import { addMinutes } from "date-fns";
import {
  findPendingOffer,
  classifyWaitingListReply,
  confirmWaitingListOffer,
  declineWaitingListOffer,
  skipWaitingListOffer,
  expireStaleWaitingListOffers,
} from "@/lib/waiting-list";
import { handleOwnerReply, isOwnerPhone } from "@/lib/owner-actions";
import { notifyOwner } from "@/lib/notify";
import { canCreateAppointment, hasFeature } from "@/lib/plan-limits";

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
  // Lê o corpo BRUTO antes de qualquer parse — a assinatura da Meta é
  // calculada sobre os bytes exatos recebidos, não sobre o JSON re-serializado.
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyPayloadSignature(rawBody, signature)) {
    console.error("[whatsapp/webhook] Assinatura X-Hub-Signature-256 ausente ou inválida — payload rejeitado.");
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);

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
      include: { owner: true },
    });
    if (!business) {
      console.error("[webhook] Negócio não encontrado para phone_number_id:", businessPhoneNumberId);
      return NextResponse.json({ ok: true });
    }

    // Varredura preguiçosa de ofertas de lista de espera vencidas (Bloco 3 Parte 1) —
    // sem worker BullMQ rodando 24/7, aproveitamos o tráfego real do webhook pra isso.
    await expireStaleWaitingListOffers();

    // Mensagem do PRÓPRIO DONO (ex: respondendo "sim"/"feirão" ao relatório mensal)
    // não passa pelo bot de atendimento a clientes.
    if (business.owner && isOwnerPhone(business.owner.phone, fromPhone)) {
      await handleOwnerReply(business.id, text);
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

  // Lista de Espera Ativa (Bloco 3 Parte 1): se esse cliente tem uma oferta de
  // vaga em aberto, interpreta a resposta ANTES de acionar o Claude — é uma
  // ação transacional (cria agendamento de verdade) e precisa ser confiável
  // mesmo em MOCK_MODE, sem depender do bot entender o contexto.
  if (client) {
    const pendingOffer = await findPendingOffer(businessId, client.id);
    if (pendingOffer) {
      const classification = classifyWaitingListReply(text);
      if (classification !== "unclear") {
        await respondToWaitingListOffer(businessId, conversation.id, history, pendingOffer, classification, clientPhone, text);
        return;
      }
    }
  }

  const [services, professionals] = await Promise.all([
    prisma.service.findMany({ where: { businessId, active: true } }),
    prisma.professional.findMany({ where: { businessId, active: true } }),
  ]);

  const visitsForNextReward = client ? await visitsUntilNextReward(businessId, client.loyaltyPoints) : null;

  const systemPrompt = buildSystemPrompt({ business, services, professionals, client, visitsForNextReward });
  const botResult = await askClaude(systemPrompt, text, history, businessId);

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
  await sendWhatsAppMessage(clientPhone, botResult.response, businessId);
}

/** Confirma, recusa ou pula a oferta de vaga da lista de espera, e responde o cliente. */
async function respondToWaitingListOffer(
  businessId: string,
  conversationId: string,
  history: any[],
  offer: { id: string; client: { name: string } },
  classification: "confirm" | "decline" | "skip",
  clientPhone: string,
  text: string
) {
  let response: string;
  if (classification === "confirm") {
    const appointment = await confirmWaitingListOffer(offer.id);
    response = appointment
      ? "Perfeito! Seu horário está confirmado ✅ Até lá!"
      : "Ih, essa vaga já não está mais disponível 😕 Vou te avisar se abrir outra.";
  } else if (classification === "decline") {
    await declineWaitingListOffer(offer.id);
    response = "Sem problemas! Removi você da lista de espera desse serviço.";
  } else {
    await skipWaitingListOffer(offer.id);
    response = "Entendido! Você continua na lista de espera pra próxima vaga que abrir. 🙏";
  }

  const updatedMessages = [
    ...history,
    { role: "client", content: text, timestamp: new Date().toISOString() },
    { role: "bot", content: response, timestamp: new Date().toISOString() },
  ];
  await prisma.conversation.update({ where: { id: conversationId }, data: { messages: updatedMessages } });
  await sendWhatsAppMessage(clientPhone, response, businessId);
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

      const planLimit = await canCreateAppointment(businessId);
      if (!planLimit.allowed) {
        await sendWhatsAppMessage(
          clientPhone,
          "Ih, desculpa! Não consigo agendar automaticamente agora — chegamos no limite de agendamentos desse mês. Vou te transferir pro dono, ele resolve rapidinho.",
          businessId
        );
        await notifyOwner(
          businessId,
          "humanRequested",
          `🚫 Não consegui agendar automaticamente pra ${existingClient.name}: o plano Grátis atingiu o limite de ${planLimit.limit} agendamentos/mês. Faça upgrade em Configurações pra liberar agendamentos ilimitados.`
        );
        return;
      }

      const noShowPredicted = calculateNoShowRisk({
        client: existingClient,
        clientConfirmed: false,
      });

      // Fidelidade (Bloco 3 Parte 3.4): se é exatamente o serviço-prêmio de uma
      // regra ativa e o cliente já tem pontos, aplica o desconto automaticamente.
      const redeemed = await tryRedeemLoyaltyReward(businessId, existingClient, data.serviceId);
      const price = redeemed ? Math.round(service.price * (1 - redeemed.discountPercent / 100) * 100) / 100 : service.price;

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
          price,
          loyaltyRewardApplied: !!redeemed,
        },
      });
      await scheduleReminders(appointment.id, startDate);

      if (redeemed) {
        await sendWhatsAppMessage(clientPhone, `🎁 Já incluí sua recompensa de fidelidade nesse agendamento!`, businessId);
      } else {
        // Avisa se o cliente JÁ tem pontos suficientes pra outra recompensa
        // (de visitas concluídas de verdade) — não é especulativo sobre esse agendamento.
        const reward = await checkLoyaltyReward(businessId, existingClient.loyaltyPoints);
        if (reward) {
          await sendWhatsAppMessage(
            clientPhone,
            `🎉 Você tem ${existingClient.loyaltyPoints} visitas completas e ganhou uma recompensa especial! Quer incluir no seu próximo atendimento?`,
            businessId
          );
        }
      }

      const professional = await prisma.professional.findUnique({ where: { id: data.professionalId } });
      await notifyOwner(
        businessId,
        "newAppointment",
        `🔔 Novo agendamento: ${existingClient.name} — ${service.name} com ${professional?.name ?? ""} em ${startDate.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}.`
      );
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
      const { offerSlotToWaitingList, logAppointmentCancelled } = await import("@/lib/waiting-list");
      const cancelledAppt = await prisma.appointment.findFirst({ where: { id: data.appointmentId, businessId }, include: { service: true } });
      if (!cancelledAppt) return;
      await prisma.appointment.update({
        where: { id: data.appointmentId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      await logAppointmentCancelled(businessId, client?.name ?? "Cliente", cancelledAppt.service.name);
      await offerSlotToWaitingList(data.appointmentId);
      await notifyOwner(businessId, "cancellation", `❌ ${client?.name ?? "Um cliente"} cancelou um agendamento.`);
      break;
    }
    case "add_to_waiting_list": {
      if (!client || !data.serviceId || !data.preferredDate) return;
      if (!(await hasFeature(businessId, "waitingList"))) {
        await sendWhatsAppMessage(
          clientPhone,
          "Ih, desculpa! Não temos lista de espera disponível no momento. Vou te transferir pro dono, ele resolve rapidinho.",
          businessId
        );
        await notifyOwner(businessId, "humanRequested", `🙋 ${client.name} queria entrar na lista de espera, mas o plano atual não inclui essa funcionalidade.`);
        return;
      }
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
    case "transfer_to_human": {
      await notifyOwner(
        businessId,
        "humanRequested",
        `🙋 ${client?.name ?? "Um cliente"} (${clientPhone}) pediu pra falar com você no WhatsApp.`
      );
      break;
    }
    case "reply":
    default:
      break;
  }
}
