/**
 * POST /api/public/payments/pix — gera a cobrança Pix (5% de desconto)
 * pro agendamento criado em /api/public/appointments. Expira em 15min.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPixCharge } from "@/lib/payments";

export async function POST(req: NextRequest) {
  const { appointmentId, token } = (await req.json()) as { appointmentId: string; token: string };
  if (!appointmentId || !token) {
    return NextResponse.json({ error: "appointmentId e token são obrigatórios." }, { status: 400 });
  }

  const bookingToken = await prisma.bookingToken.findUnique({ where: { token } });
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId }, include: { service: true } });

  if (!bookingToken || !appointment || appointment.businessId !== bookingToken.businessId) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }
  if (appointment.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Esse agendamento já foi pago." }, { status: 409 });
  }

  const amount = appointment.price ?? appointment.service.price;
  const charge = await createPixCharge({ amount, description: `Agendamento ${appointment.service.name}` });
  const expiresAt = new Date(charge.expiresAt);

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { paymentId: charge.paymentId, paymentExpiresAt: expiresAt },
  });

  return NextResponse.json({
    paymentId: charge.paymentId,
    qrCodeText: charge.qrCodeText,
    expiresAt: charge.expiresAt,
    amount,
    mocked: charge.mocked,
  });
}
