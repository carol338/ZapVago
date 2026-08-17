/**
 * PUT    /api/appointments/[id] — remarcar (nova data) ou editar
 * DELETE /api/appointments/[id] — cancelar; dispara lista de espera ativa
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { addMinutes, differenceInHours } from "date-fns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { offerSlotToWaitingList, logAppointmentCancelled } from "@/lib/waiting-list";
import { scheduleReminders } from "@/lib/queue";
import { recalculateClientFutureRisk } from "@/lib/noshow";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const LATE_CANCEL_HOURS = 24; // cancelou com menos de 24h de antecedência = "em cima da hora"

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

  const appointment = await prisma.appointment.findFirst({
    where: { id: params.id, businessId },
    include: { client: true, service: true, professional: true },
  });
  if (!appointment) return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  if (appointment.status === "CANCELLED") {
    return NextResponse.json({ error: "Esse agendamento já está cancelado." }, { status: 409 });
  }

  // Cancelamento pelo painel do dono — a política de antecedência
  // (cancelDeadlineHours/allowCancel) é sobre o AUTO-atendimento do cliente
  // pelo WhatsApp, não sobre o dono gerenciar a própria agenda: ele pode
  // cancelar qualquer horário, a qualquer momento.
  await prisma.appointment.update({ where: { id: params.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });

  const isLateCancel = differenceInHours(appointment.date, new Date()) < LATE_CANCEL_HOURS;
  if (isLateCancel) {
    await prisma.client.update({ where: { id: appointment.clientId }, data: { cancelLateCount: { increment: 1 } } });
  }
  await recalculateClientFutureRisk(appointment.clientId);

  await logAppointmentCancelled(businessId, appointment.client.name, appointment.service.name);

  // Diferencial 2: Lista de Espera Ativa — oferece a vaga imediatamente
  const offered = await offerSlotToWaitingList(params.id);

  // Avisa o cliente que o horário foi cancelado pelo negócio.
  const dataFormatada = format(appointment.date, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR });
  await sendWhatsAppMessage(
    appointment.client.phone,
    `Oi ${appointment.client.name.split(" ")[0]}, seu horário de ${appointment.service.name} com ${appointment.professional.name} (${dataFormatada}) foi cancelado. Qualquer coisa é só chamar aqui pra remarcar. 🙏`
  );

  return NextResponse.json({
    ok: true,
    offeredToWaitingList: !!offered,
    offeredClientName: offered ? offered.client.name : null,
  });
}
