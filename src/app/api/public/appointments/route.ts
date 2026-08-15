/**
 * POST /api/public/appointments — cria o agendamento a partir da página
 * pública. Se paymentMethod for "local", já confirma direto (sem cobrar).
 * Se for "pix"/"card", fica PENDING_CONFIRMATION até o passo de pagamento
 * (ver /api/public/payments/pix e /api/public/payments/card).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMinutes } from "date-fns";
import { notifyClientConfirmed } from "@/lib/booking";
import { parseLocalDate } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, serviceId, professionalId, date, time, paymentMethod } = body as {
    token: string;
    serviceId: string;
    professionalId: string;
    date: string; // "2026-08-17"
    time: string; // "10:00"
    paymentMethod: "pix" | "card" | "local";
  };

  if (!token || !serviceId || !professionalId || !date || !time || !paymentMethod) {
    return NextResponse.json({ error: "Dados incompletos para criar o agendamento." }, { status: 400 });
  }

  const bookingToken = await prisma.bookingToken.findUnique({ where: { token }, include: { client: true } });
  if (!bookingToken || bookingToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link de agendamento inválido ou expirado." }, { status: 404 });
  }
  if (!bookingToken.client) {
    return NextResponse.json({ error: "Esse link não está associado a um cliente." }, { status: 400 });
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || service.businessId !== bookingToken.businessId) {
    return NextResponse.json({ error: "Serviço inválido." }, { status: 400 });
  }

  const [h, m] = time.split(":").map(Number);
  const startDate = parseLocalDate(date);
  startDate.setHours(h, m, 0, 0);
  const endDate = addMinutes(startDate, service.duration);

  const isLocal = paymentMethod === "local";
  const discount = paymentMethod === "pix" ? Math.round(service.price * 0.05 * 100) / 100 : 0;

  const appointment = await prisma.appointment.create({
    data: {
      businessId: bookingToken.businessId,
      clientId: bookingToken.client.id,
      serviceId: service.id,
      professionalId,
      date: startDate,
      endTime: endDate,
      status: isLocal ? "CONFIRMED" : "PENDING_CONFIRMATION",
      source: "WHATSAPP",
      price: service.price - discount,
      paymentMethod,
      paymentStatus: isLocal ? "PENDING" : "PENDING",
      paymentDiscount: discount,
    },
    include: { client: true, service: true, professional: true },
  });

  await prisma.bookingToken.update({ where: { id: bookingToken.id }, data: { usedAt: new Date() } });

  if (isLocal) {
    await notifyClientConfirmed(appointment);
  }

  return NextResponse.json({
    appointmentId: appointment.id,
    status: appointment.status,
    price: appointment.price,
  });
}
