/**
 * GET /api/public/appointments/[id]/status — pra a tela de Pix ficar
 * consultando (polling) se o pagamento já caiu. Se o Pix passou dos 15min
 * sem pagar, cancela o agendamento e libera o horário.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  let appointment = await prisma.appointment.findUnique({ where: { id: params.id } });
  if (!appointment) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  const expired =
    appointment.paymentStatus === "PENDING" &&
    appointment.paymentMethod === "pix" &&
    appointment.paymentExpiresAt &&
    appointment.paymentExpiresAt < new Date();

  if (expired) {
    appointment = await prisma.appointment.update({ where: { id: params.id }, data: { status: "CANCELLED" } });
  }

  return NextResponse.json({ status: appointment.status, paymentStatus: appointment.paymentStatus });
}
