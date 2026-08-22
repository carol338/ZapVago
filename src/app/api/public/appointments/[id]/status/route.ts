/**
 * GET /api/public/appointments/[id]/status?token= — pra a tela de Pix ficar
 * consultando (polling) se o pagamento já caiu. Se o Pix passou dos 15min
 * sem pagar, cancela o agendamento e libera o horário.
 *
 * Exige o mesmo token de agendamento usado pra criar/pagar esse agendamento
 * (mesmo padrão de /api/public/payments/pix e /card) — sem isso, bastaria
 * saber/adivinhar o id do agendamento (nenhuma prova de que é o dono dele)
 * pra consultar o status de qualquer cliente de qualquer negócio.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token é obrigatório." }, { status: 400 });
  }

  const bookingToken = await prisma.bookingToken.findUnique({ where: { token } });
  let appointment = await prisma.appointment.findUnique({ where: { id: params.id } });
  if (
    !bookingToken ||
    !appointment ||
    appointment.businessId !== bookingToken.businessId ||
    (bookingToken.clientId && appointment.clientId !== bookingToken.clientId)
  ) {
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
