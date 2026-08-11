/**
 * PUT    /api/appointments/[id] — remarcar (nova data) ou editar
 * DELETE /api/appointments/[id] — cancelar; dispara lista de espera ativa
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { addMinutes, differenceInHours } from "date-fns";
import { offerSlotToWaitingList } from "@/lib/waiting-list";
import { scheduleReminders } from "@/lib/queue";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const body = await req.json();
  const appointment = await prisma.appointment.findFirst({ where: { id: params.id, businessId }, include: { service: true } });
  if (!appointment) return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });

  const newDate = body.date ? new Date(body.date) : appointment.date;
  const newEndTime = addMinutes(newDate, appointment.service.duration);

  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      date: newDate,
      endTime: newEndTime,
      professionalId: body.professionalId ?? appointment.professionalId,
      notes: body.notes ?? appointment.notes,
      status: body.status ?? appointment.status,
    },
  });

  if (body.date) await scheduleReminders(updated.id, newDate);

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  const settings = (business?.settings as any) || {};
  const deadline = settings.cancelDeadlineHours ?? 4;

  const appointment = await prisma.appointment.findFirst({ where: { id: params.id, businessId } });
  if (!appointment) return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });

  // Regra de negócio 3: cancelamento apenas até X horas antes (configurável)
  if (settings.allowCancel === false) {
    return NextResponse.json({ error: "Cancelamento não permitido para este negócio." }, { status: 403 });
  }
  if (differenceInHours(appointment.date, new Date()) < deadline) {
    return NextResponse.json({ error: `Cancelamento permitido apenas com ${deadline}h de antecedência.` }, { status: 403 });
  }

  await prisma.appointment.update({ where: { id: params.id }, data: { status: "CANCELLED" } });

  // Diferencial 2: Lista de Espera Ativa — oferece a vaga imediatamente
  const offered = await offerSlotToWaitingList(params.id);

  return NextResponse.json({ ok: true, offeredToWaitingList: !!offered });
}
