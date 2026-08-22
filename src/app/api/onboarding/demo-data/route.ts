/**
 * POST   /api/onboarding/demo-data — cria dados de demonstração (5 clientes
 *        fake + até 10 agendamentos fake nos próximos 7 dias, distribuídos
 *        nos horários de funcionamento) pra um negócio recém-cadastrado ver
 *        o painel funcionando em vez de uma tela vazia. Chamado uma única
 *        vez, ao final do onboarding (ver OnboardingWizard.finishOnboarding).
 * DELETE /api/onboarding/demo-data — remove os agendamentos marcados isDemo,
 *        e os clientes demo que não ficaram com nenhum agendamento real
 *        depois disso (protege contra apagar um cliente fake que o dono já
 *        usou pra marcar um horário de verdade).
 *
 * Em nenhum dos dois casos business.demoSeededAt é limpo — é isso que
 * garante "só uma vez por negócio" e "se excluir, não recria".
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { addDays, addMinutes, setHours, setMinutes, startOfDay } from "date-fns";

const DEMO_CLIENTS = [
  { name: "Maria Silva", phone: "5511900010001" },
  { name: "João Pereira", phone: "5511900010002" },
  { name: "Carla Mendes", phone: "5511900010003" },
  { name: "Pedro Santos", phone: "5511900010004" },
  { name: "Ana Souza", phone: "5511900010005" },
];

const DEMO_NOTE = "Agendamento de teste — exclua quando quiser";
const APPOINTMENTS_TO_CREATE = 10;
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Todos os horários livres (respeitando bloqueios) nos próximos 7 dias, a partir de agora. */
function buildCandidateSlots(settings: any, slotDuration: number) {
  const workingHours = settings?.workingHours ?? {};
  const blockedSlots: { day: string; start: string; end: string }[] = settings?.blockedSlots ?? [];
  const now = new Date();
  const slots: Date[] = [];

  for (let offset = 0; offset < 7; offset++) {
    const day = addDays(startOfDay(now), offset);
    const dayKey = DAY_KEYS[day.getDay()];
    const hours = workingHours[dayKey];
    if (!hours) continue;

    const startMin = timeToMinutes(hours.start);
    const endMin = timeToMinutes(hours.end);
    const blockedRanges = blockedSlots.filter((b) => b.day === dayKey).map((b) => [timeToMinutes(b.start), timeToMinutes(b.end)]);

    for (let m = startMin; m + slotDuration <= endMin; m += slotDuration) {
      const overlapsBlocked = blockedRanges.some(([bs, be]) => m < be && m + slotDuration > bs);
      if (overlapsBlocked) continue;
      const slotDate = setMinutes(setHours(day, Math.floor(m / 60)), m % 60);
      if (slotDate <= now) continue;
      slots.push(slotDate);
    }
  }
  return slots;
}

export async function POST() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return NextResponse.json({ error: "Negócio não encontrado." }, { status: 404 });

  if (business.demoSeededAt) {
    return NextResponse.json({ seeded: false, reason: "already_seeded" });
  }

  const [existingAppointments, services, professionals] = await Promise.all([
    prisma.appointment.count({ where: { businessId } }),
    prisma.service.findMany({ where: { businessId } }),
    prisma.professional.findMany({ where: { businessId } }),
  ]);

  if (existingAppointments > 0 || services.length === 0 || professionals.length === 0) {
    await prisma.business.update({ where: { id: businessId }, data: { demoSeededAt: new Date() } });
    return NextResponse.json({
      seeded: false,
      reason: existingAppointments > 0 ? "has_appointments" : "missing_services_or_professionals",
    });
  }

  const settings = (business.settings as any) ?? {};
  const slotDuration = settings.slotDuration ?? 30;
  const candidateSlots = buildCandidateSlots(settings, slotDuration);

  if (candidateSlots.length === 0) {
    await prisma.business.update({ where: { id: businessId }, data: { demoSeededAt: new Date() } });
    return NextResponse.json({ seeded: false, reason: "no_working_hours" });
  }

  const demoClients = await Promise.all(
    DEMO_CLIENTS.map((c) => prisma.client.create({ data: { businessId, name: c.name, phone: c.phone, isDemo: true } }))
  );

  const step = Math.max(1, Math.floor(candidateSlots.length / APPOINTMENTS_TO_CREATE));
  const usedProfessionalSlots = new Set<string>();
  let created = 0;

  for (let i = 0; i < candidateSlots.length && created < APPOINTMENTS_TO_CREATE; i += step) {
    const service = services[created % services.length];
    const professional = professionals[created % professionals.length];
    const date = candidateSlots[i];
    const key = `${professional.id}|${date.getTime()}`;
    if (usedProfessionalSlots.has(key)) continue;
    usedProfessionalSlots.add(key);

    const client = demoClients[created % demoClients.length];
    const endTime = addMinutes(date, service.duration);

    await prisma.appointment.create({
      data: {
        businessId,
        clientId: client.id,
        serviceId: service.id,
        professionalId: professional.id,
        date,
        endTime,
        status: "CONFIRMED",
        source: "MANUAL",
        clientConfirmed: true,
        notes: DEMO_NOTE,
        price: service.price,
        isDemo: true,
      },
    });
    created += 1;
  }

  await prisma.business.update({ where: { id: businessId }, data: { demoSeededAt: new Date() } });

  return NextResponse.json({ seeded: true, clientsCreated: demoClients.length, appointmentsCreated: created });
}

export async function DELETE() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const { count: deletedAppointments } = await prisma.appointment.deleteMany({ where: { businessId, isDemo: true } });

  const demoClients = await prisma.client.findMany({
    where: { businessId, isDemo: true },
    include: { _count: { select: { appointments: true } } },
  });
  const clientIdsToDelete = demoClients.filter((c) => c._count.appointments === 0).map((c) => c.id);
  const { count: deletedClients } = clientIdsToDelete.length
    ? await prisma.client.deleteMany({ where: { id: { in: clientIdsToDelete } } })
    : { count: 0 };

  return NextResponse.json({ ok: true, deletedAppointments, deletedClients });
}
