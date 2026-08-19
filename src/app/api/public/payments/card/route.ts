/**
 * POST /api/public/payments/card — cobra no cartão (mock sempre aprova)
 * e já confirma o agendamento.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chargeCard } from "@/lib/payments";
import { confirmAppointmentPayment } from "@/lib/booking";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const ipCheck = await checkRateLimit(`payments:card:ip:${ip}`, 10, 60 * 60);
  if (!ipCheck.allowed) {
    return NextResponse.json({ error: "Muitas tentativas de pagamento. Tente novamente em alguns minutos." }, { status: 429 });
  }

  const { appointmentId, token, installments, cardToken, paymentMethodId } = (await req.json()) as {
    appointmentId: string;
    token: string;
    installments?: number;
    // Gerados pelo SDK de tokenização do Mercado Pago no frontend (Card Form/Bricks) —
    // ainda não implementado na página pública, por isso são opcionais por enquanto.
    cardToken?: string;
    paymentMethodId?: string;
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
  let result;
  try {
    result = await chargeCard({
      amount,
      description: `Agendamento ${appointment.service.name}`,
      appointmentId,
      businessId: appointment.businessId,
      installments: installments ?? 1,
      cardToken: cardToken ?? "",
      paymentMethodId,
    });
  } catch (err) {
    console.error("[api/public/payments/card] Erro ao cobrar cartão:", err);
    return NextResponse.json({ error: "Não foi possível processar o pagamento no cartão." }, { status: 502 });
  }

  if (result.status === "rejected") {
    return NextResponse.json({ status: "rejected" }, { status: 402 });
  }

  if (result.status === "pending") {
    // Nem aprovado nem recusado ainda — alguns métodos ficam em análise
    // assíncrona. Guardamos o paymentId pra o webhook confirmar de verdade
    // quando o Mercado Pago decidir (não confirmamos o agendamento aqui).
    await prisma.appointment.update({ where: { id: appointmentId }, data: { paymentId: result.paymentId, paymentStatus: "PENDING" } });
    return NextResponse.json({ status: "pending", appointmentId, mocked: result.mocked });
  }

  await confirmAppointmentPayment(appointmentId, result.paymentId);

  return NextResponse.json({ status: "approved", appointmentId, mocked: result.mocked });
}
