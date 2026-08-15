/**
 * GET  /api/appointments?date=YYYY-MM-DD&view=week|day — lista agendamentos
 * POST /api/appointments — cria agendamento manual, valida sobreposição,
 *       calcula risco de no-show e agenda lembretes.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { addMinutes, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";
import { calculateNoShowRisk } from "@/lib/noshow";
import { scheduleReminders } from "@/lib/queue";

export async function GET(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const view = searchParams.get("view") ?? "week";
  const professionalId = searchParams.get("professionalId");

  const baseDate = dateParam ? new Date(dateParam) : new Date();
  const range =
    view === "day"
      ? { gte: startOfDay(baseDate), lte: endOfDay(baseDate) }
      : { gte: startOfWeek(baseDate, { weekStartsOn: 1 }), lte: endOfWeek(baseDate, { weekStartsOn: 1 }) };

  const appointments = await prisma.appointment.findMany({
    where: {
      businessId,
      date: range,
      ...(professionalId ? { professionalId } : {}),
    },
    include: { client: true, service: true, professional: true },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const body = await req.json();
  const { clientName, clientPhone, serviceId, professionalId, date } = body;

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });

  const startDate = new Date(date);
  const endTime = addMinutes(startDate, service.duration);

  // Regra de negócio 1: profissional não pode ter 2 agendamentos sobrepostos
  const conflict = await prisma.appointment.findFirst({
    where: {
      professionalId,
      status: { in: ["CONFIRMED", "PENDING_CONFIRMATION"] },
      AND: [{ date: { lt: endTime } }, { endTime: { gt: startDate } }],
    },
  });
  if (conflict) {
    return NextResponse.json({ error: "Esse profissional já tem um horário nesse período." }, { status: 409 });
  }

  // Regra de negócio 4: cliente novo criado automaticamente / 5: reconhecido por telefone
  let client = await prisma.client.findUnique({ where: { businessId_phone: { businessId, phone: clientPhone } } });
  if (!client) {
    client = await prisma.client.create({
      data: { businessId, name: clientName, phone: clientPhone, tags: ["novo"] },
    });
  }

  const noShowPredicted = calculateNoShowRisk({
    client,
    clientConfirmed: false,
  });

  const appointment = await prisma.appointment.create({
    data: {
      businessId,
      clientId: client.id,
      serviceId,
      professionalId,
      date: startDate,
      endTime,
      source: body.source ?? "MANUAL",
      noShowPredicted,
    },
    include: { client: true, service: true, professional: true },
  });

  await scheduleReminders(appointment.id, startDate);

  return NextResponse.json(appointment, { status: 201 });
}
