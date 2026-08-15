/**
 * POST /api/public/payments/card — cobra no cartão (mock sempre aprova)
 * e já confirma o agendamento.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chargeCard } from "@/lib/payments";
import { confirmAppointmentPayment } from "@/lib/booking";

export async function POST(req: NextRequest) {
  const { appointmentId, token, installments } = (await req.json()) as {
    appointmentId: string;
    token: string;
    installments?: number;
  };
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
  const result = await chargeCard({ amount, installments: installments ?? 1 });

  if (result.status !== "approved") {
    return NextResponse.json({ status: "rejected" }, { status: 402 });
  }

  await confirmAppointmentPayment(appointmentId, result.paymentId);

  return NextResponse.json({ status: "approved", appointmentId, mocked: result.mocked });
}
