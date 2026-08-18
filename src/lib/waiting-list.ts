/**
 * Lista de Espera Ativa — Bloco 3 Parte 1.
 * Quando um agendamento é cancelado, busca clientes esperando aquele
 * serviço/período e oferece o horário em ordem de prioridade. O cliente
 * tem 15 minutos pra confirmar (SIM) antes da vaga passar pro próximo.
 *
 * Cada passo do fluxo (cancelamento → notificação → resposta → agendamento)
 * é gravado em WaitingListEvent — dá pra acompanhar tudo pelo painel em
 * /dashboard/waiting-list mesmo sem WhatsApp real (MOCK_MODE).
 */
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { isSameDay } from "date-fns";
import { calculateNoShowRisk } from "@/lib/noshow";
import { notifyOwner } from "@/lib/notify";

export const OFFER_TIMEOUT_MINUTES = 15;

type WaitingListEventType = "cancelled" | "notified" | "replied_yes" | "replied_no" | "replied_skip" | "booked" | "expired";

async function logEvent(businessId: string, type: WaitingListEventType, message: string) {
  await prisma.waitingListEvent.create({ data: { businessId, type, message } });
}

/**
 * Oferece a vaga de um agendamento cancelado ao próximo candidato elegível
 * da lista de espera. Chamado logo após o cancelamento e, de novo, sempre
 * que uma oferta anterior para essa mesma vaga expira sem resposta.
 */
export async function offerSlotToWaitingList(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { service: true, professional: true, business: true, client: true },
  });
  if (!appointment) return null;

  const candidates = await prisma.waitingListEntry.findMany({
    where: {
      businessId: appointment.businessId,
      serviceId: appointment.serviceId,
      notified: false,
      resolvedAt: null,
      clientId: { not: appointment.clientId },
      NOT: { excludedAppointmentIds: { has: appointmentId } },
    },
    include: { client: true },
  });

  // Filtra por compatibilidade de data/período e ordena por prioridade:
  // VIP primeiro, depois tempo de espera (mais antigo primeiro), depois flexibilidade.
  const matching = candidates
    .filter((c) => c.flexibleDates || isSameDay(c.preferredDate, appointment.date))
    .sort((a, b) => {
      const aVip = a.client.tags.includes("vip") ? 0 : 1;
      const bVip = b.client.tags.includes("vip") ? 0 : 1;
      if (aVip !== bVip) return aVip - bVip;
      if (a.createdAt.getTime() !== b.createdAt.getTime()) return a.createdAt.getTime() - b.createdAt.getTime();
      return a.flexibleDates === b.flexibleDates ? 0 : a.flexibleDates ? -1 : 1;
    });

  const first = matching[0];
  if (!first) return null;

  const horario = appointment.date.toLocaleString("pt-BR", { weekday: "long", hour: "2-digit", minute: "2-digit" });
  const msg = `${first.client.name.split(" ")[0]}! Cancelou um horário ${horario} com ${appointment.professional.name} para ${appointment.service.name}. Ainda quer? Responda SIM em ${OFFER_TIMEOUT_MINUTES} minutos para garantir. ⏰`;

  await sendWhatsAppMessage(first.client.phone, msg, appointment.businessId);
  await prisma.waitingListEntry.update({
    where: { id: first.id },
    data: { notified: true, notifiedAt: new Date(), offeredAppointmentId: appointmentId },
  });

  await logEvent(appointment.businessId, "notified", `${first.client.name} notificado via WhatsApp sobre a vaga de ${appointment.service.name}.`);

  // Em produção com Redis configurado, agenda o timeout via BullMQ (best-effort).
  // Sem Redis (padrão deste ambiente), expireStaleWaitingListOffers() varre as
  // ofertas vencidas sempre que chega uma mensagem no webhook ou a fila é aberta.
  const { scheduleWaitingListTimeout } = await import("@/lib/queue");
  await scheduleWaitingListTimeout(first.id);

  return first;
}

/**
 * Registra o cancelamento em si no log de eventos, independente de ter
 * encontrado alguém na fila pra oferecer a vaga ou não. Chamado pelas
 * rotas de cancelamento (painel do dono e bot do WhatsApp).
 */
export async function logAppointmentCancelled(businessId: string, clientName: string, serviceName: string) {
  await logEvent(businessId, "cancelled", `${clientName} cancelou (${serviceName})`);
}

/** Encontra uma oferta ainda válida (não expirada) pendente para esse cliente. */
export async function findPendingOffer(businessId: string, clientId: string) {
  const cutoff = new Date(Date.now() - OFFER_TIMEOUT_MINUTES * 60 * 1000);
  return prisma.waitingListEntry.findFirst({
    where: { businessId, clientId, notified: true, notifiedAt: { gte: cutoff }, offeredAppointmentId: { not: null } },
    include: { client: true, service: true },
  });
}

/** Cliente confirmou (SIM) — cria o agendamento e marca a entrada como resolvida. */
export async function confirmWaitingListOffer(entryId: string) {
  const entry = await prisma.waitingListEntry.findUnique({
    where: { id: entryId },
    include: { client: true },
  });
  if (!entry || !entry.offeredAppointmentId) return null;

  const cancelledAppointment = await prisma.appointment.findUnique({
    where: { id: entry.offeredAppointmentId },
    include: { service: true, professional: true, business: { include: { owner: true } } },
  });
  if (!cancelledAppointment) return null;

  const noShowPredicted = calculateNoShowRisk({ client: entry.client, clientConfirmed: true });

  const appointment = await prisma.appointment.create({
    data: {
      businessId: cancelledAppointment.businessId,
      clientId: entry.clientId,
      serviceId: cancelledAppointment.serviceId,
      professionalId: cancelledAppointment.professionalId,
      date: cancelledAppointment.date,
      endTime: cancelledAppointment.endTime,
      status: "CONFIRMED",
      source: "WHATSAPP",
      clientConfirmed: true,
      noShowPredicted,
      fromWaitingList: true,
    },
  });

  await prisma.waitingListEntry.update({
    where: { id: entry.id },
    data: { resolvedAt: new Date(), resolution: "booked" },
  });

  await logEvent(cancelledAppointment.businessId, "replied_yes", `${entry.client.name} respondeu SIM.`);
  await logEvent(cancelledAppointment.businessId, "booked", `Agendamento criado automaticamente para ${entry.client.name}.`);

  if (cancelledAppointment.business.owner) {
    await notifyOwner(cancelledAppointment.businessId, "newAppointment", `✅ ${entry.client.name.split(" ")[0]} preencheu o horário que estava vago (${cancelledAppointment.service.name} com ${cancelledAppointment.professional.name}).`);
  }

  return appointment;
}

/** Cliente recusou explicitamente — marca a entrada como resolvida (não volta a ser ofertado). */
export async function declineWaitingListOffer(entryId: string) {
  const entry = await prisma.waitingListEntry.update({
    where: { id: entryId },
    data: { resolvedAt: new Date(), resolution: "declined" },
    include: { client: true },
  });
  await logEvent(entry.businessId, "replied_no", `${entry.client.name} respondeu que não quer mais.`);
}

/**
 * Cliente não pode nesse horário específico (ou a oferta expirou sozinha),
 * mas continua na fila pra próxima oportunidade.
 */
export async function skipWaitingListOffer(entryId: string, reason: "replied_skip" | "expired" = "replied_skip") {
  const entry = await prisma.waitingListEntry.findUnique({ where: { id: entryId }, include: { client: true } });
  if (!entry) return;
  const excluded = entry.offeredAppointmentId ? [...entry.excludedAppointmentIds, entry.offeredAppointmentId] : entry.excludedAppointmentIds;
  await prisma.waitingListEntry.update({
    where: { id: entryId },
    data: { notified: false, notifiedAt: null, offeredAppointmentId: null, excludedAppointmentIds: excluded },
  });

  const message =
    reason === "expired"
      ? `${entry.client.name} não respondeu em ${OFFER_TIMEOUT_MINUTES} minutos — oferta expirada.`
      : `${entry.client.name} respondeu que não pode nesse horário — continua na fila.`;
  await logEvent(entry.businessId, reason, message);

  if (entry.offeredAppointmentId) await offerSlotToWaitingList(entry.offeredAppointmentId);
}

/**
 * Interpreta a resposta do cliente a uma oferta de vaga (Bloco 3 Parte 1.4).
 * Confirmação determinística por palavras-chave — não depende do Claude,
 * já que essa é uma ação transacional (cria agendamento de verdade) e
 * precisa funcionar de forma confiável mesmo em MOCK_MODE.
 */
export function classifyWaitingListReply(text: string): "confirm" | "decline" | "skip" | "unclear" {
  const lower = text.toLowerCase().trim();

  if (/n[aã]o posso.*(hor[aá]rio|essa hora|esse hor[aá]rio)/.test(lower)) return "skip";
  if (/j[aá]\s*marquei/.test(lower) || /^n[aã]o$/.test(lower) || /agora n[aã]o/.test(lower)) return "decline";
  if (/\b(sim|quero|pode agendar|bora|claro|isso|confirmo|fechado)\b/.test(lower)) return "confirm";

  return "unclear";
}

/**
 * Varre ofertas com mais de 15min sem resposta e passa a vaga pro próximo
 * candidato. Chamada de forma "preguiçosa" (lazy) sempre que faz sentido
 * checar — abrir o painel de lista de espera, ou receber uma mensagem no
 * webhook — já que este ambiente não tem um worker BullMQ rodando 24/7.
 */
export async function expireStaleWaitingListOffers() {
  const cutoff = new Date(Date.now() - OFFER_TIMEOUT_MINUTES * 60 * 1000);
  const stale = await prisma.waitingListEntry.findMany({
    where: { notified: true, notifiedAt: { lt: cutoff }, offeredAppointmentId: { not: null } },
  });

  for (const entry of stale) {
    await skipWaitingListOffer(entry.id, "expired");
  }

  return stale.length;
}
