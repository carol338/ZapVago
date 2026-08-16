/**
 * Lista de Espera Ativa — Bloco 3 Parte 1.
 * Quando um agendamento é cancelado, busca clientes esperando aquele
 * serviço/período e oferece o horário em ordem de prioridade. O cliente
 * tem 15 minutos pra confirmar (SIM) antes da vaga passar pro próximo.
 */
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { isSameDay, addMinutes } from "date-fns";
import { calculateNoShowRisk } from "@/lib/noshow";
import { notifyOwner } from "@/lib/notify";

export const OFFER_TIMEOUT_MINUTES = 15;

/**
 * Oferece a vaga de um agendamento cancelado ao próximo candidato elegível
 * da lista de espera. Chamado logo após o cancelamento e, de novo, sempre
 * que uma oferta anterior para essa mesma vaga expira sem resposta.
 */
export async function offerSlotToWaitingList(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { service: true, professional: true, business: true },
  });
  if (!appointment) return null;

  const candidates = await prisma.waitingListEntry.findMany({
    where: {
      businessId: appointment.businessId,
      serviceId: appointment.serviceId,
      notified: false,
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

  await sendWhatsAppMessage(first.client.phone, msg);
  await prisma.waitingListEntry.update({
    where: { id: first.id },
    data: { notified: true, notifiedAt: new Date(), offeredAppointmentId: appointmentId },
  });

  // Em produção com Redis configurado, agenda o timeout via BullMQ (best-effort).
  // Sem Redis (padrão deste ambiente), expireStaleWaitingListOffers() varre as
  // ofertas vencidas sempre que chega uma mensagem no webhook ou a fila é aberta.
  const { scheduleWaitingListTimeout } = await import("@/lib/queue");
  await scheduleWaitingListTimeout(first.id);

  return first;
}

/** Encontra uma oferta ainda válida (não expirada) pendente para esse cliente. */
export async function findPendingOffer(businessId: string, clientId: string) {
  const cutoff = new Date(Date.now() - OFFER_TIMEOUT_MINUTES * 60 * 1000);
  return prisma.waitingListEntry.findFirst({
    where: { businessId, clientId, notified: true, notifiedAt: { gte: cutoff }, offeredAppointmentId: { not: null } },
    include: { client: true, service: true },
  });
}

/** Cliente confirmou (SIM) — cria o agendamento e remove da fila. */
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

  await prisma.waitingListEntry.delete({ where: { id: entry.id } });

  if (cancelledAppointment.business.owner) {
    await notifyOwner(cancelledAppointment.businessId, "newAppointment", `✅ ${entry.client.name.split(" ")[0]} preencheu o horário que estava vago (${cancelledAppointment.service.name} com ${cancelledAppointment.professional.name}).`);
  }

  return appointment;
}

/** Cliente recusou explicitamente — remove da fila (não volta a ser ofertado). */
export async function declineWaitingListOffer(entryId: string) {
  await prisma.waitingListEntry.delete({ where: { id: entryId } });
}

/** Cliente não pode nesse horário específico, mas quer continuar na fila pra próxima. */
export async function skipWaitingListOffer(entryId: string) {
  const entry = await prisma.waitingListEntry.findUnique({ where: { id: entryId } });
  if (!entry) return;
  const excluded = entry.offeredAppointmentId ? [...entry.excludedAppointmentIds, entry.offeredAppointmentId] : entry.excludedAppointmentIds;
  await prisma.waitingListEntry.update({
    where: { id: entryId },
    data: { notified: false, notifiedAt: null, offeredAppointmentId: null, excludedAppointmentIds: excluded },
  });
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
    await skipWaitingListOffer(entry.id);
  }

  return stale.length;
}
