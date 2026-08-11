/**
 * Lista de Espera Ativa — Diferencial 2.
 * Quando um agendamento é cancelado, busca clientes esperando aquele
 * serviço/período e oferece o horário em ordem de prioridade.
 */
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { isSameDay } from "date-fns";

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
  const msg = `${first.client.name.split(" ")[0]}, abriu um horário ${horario} com ${appointment.professional.name} para ${appointment.service.name}. Ainda quer? Responda SIM em até 10 minutos! ⏰`;

  await sendWhatsAppMessage(first.client.phone, msg);
  await prisma.waitingListEntry.update({ where: { id: first.id }, data: { notified: true } });

  // Em produção, um job do BullMQ agendado para +10min verificaria a resposta
  // e, se não confirmada, passaria para o próximo candidato (ver queue.ts).
  return first;
}
