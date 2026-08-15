/**
 * Cálculo de horários disponíveis para a página pública de agendamento.
 * Considera horário de funcionamento, bloqueios fixos (ex: almoço) e
 * agendamentos já existentes. Se nenhum profissional for informado,
 * retorna o primeiro profissional livre que faz aquele serviço.
 */
import { prisma } from "@/lib/prisma";
import { addMinutes, format, isSameDay, startOfDay } from "date-fns";

const DIA_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]; // Date.getDay(): 0=domingo

export interface AvailableSlot {
  time: string; // "10:00"
  professionalId: string;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export async function getAvailableSlots(params: {
  businessId: string;
  date: Date;
  serviceId: string;
  professionalId?: string;
}): Promise<AvailableSlot[]> {
  const { businessId, date, serviceId, professionalId } = params;

  const [business, service, professionals] = await Promise.all([
    prisma.business.findUnique({ where: { id: businessId } }),
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.professional.findMany({
      where: { businessId, active: true, ...(professionalId ? { id: professionalId } : {}) },
    }),
  ]);
  if (!business || !service) return [];

  const candidates = professionals.filter((p) => p.serviceIds.includes(serviceId));
  if (candidates.length === 0) return [];

  const settings = (business.settings as Record<string, any>) ?? {};
  const dayKey = DIA_KEYS[date.getDay()];
  const hours = settings.workingHours?.[dayKey];
  if (!hours) return [];

  const slotDuration: number = settings.slotDuration ?? 30;
  const blockedToday: { day: string; start: string; end: string }[] = (settings.blockedSlots ?? []).filter(
    (b: any) => b.day === dayKey
  );

  const dayStart = startOfDay(date);
  const openMin = toMinutes(hours.start);
  const closeMin = toMinutes(hours.end);

  const dayEnd = addMinutes(dayStart, 24 * 60 - 1);
  const existing = await prisma.appointment.findMany({
    where: {
      businessId,
      professionalId: { in: candidates.map((p) => p.id) },
      date: { gte: dayStart, lte: dayEnd },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
  });

  const now = new Date();
  const slots: AvailableSlot[] = [];

  for (let startMin = openMin; startMin + service.duration <= closeMin; startMin += slotDuration) {
    const slotStart = addMinutes(dayStart, startMin);
    const slotEnd = addMinutes(dayStart, startMin + service.duration);

    if (isSameDay(date, now) && slotStart < now) continue;

    const blocked = blockedToday.some((b) => {
      const bStart = toMinutes(b.start);
      const bEnd = toMinutes(b.end);
      return startMin < bEnd && startMin + service.duration > bStart;
    });
    if (blocked) continue;

    const free = candidates.find((p) => {
      return !existing.some((a) => a.professionalId === p.id && slotStart < a.endTime && slotEnd > a.date);
    });
    if (!free) continue;

    slots.push({ time: format(slotStart, "HH:mm"), professionalId: free.id });
  }

  return slots;
}
