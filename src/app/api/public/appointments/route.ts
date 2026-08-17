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
import { tryRedeemLoyaltyReward } from "@/lib/loyalty";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, serviceId, professionalId, date, time, paymentMethod, flashSaleId } = body as {
    token: string;
    serviceId: string;
    professionalId: string;
    date: string; // "2026-08-17"
    time: string; // "10:00"
    paymentMethod: "pix" | "card" | "local";
    flashSaleId?: string;
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

  // Feirão (Bloco 3 Parte 2): valida server-side que o link ainda é válido pro
  // serviço escolhido — nunca confia no preço calculado no navegador.
  let basePrice = service.price;
  let validFlashSaleId: string | undefined;
  if (flashSaleId) {
    const flashSale = await prisma.flashSale.findFirst({
      where: { id: flashSaleId, businessId: bookingToken.businessId, active: true },
    });
    if (flashSale && flashSale.serviceIds.includes(service.id)) {
      const jsDay = startDate.getDay();
      const dayOfWeek = jsDay === 0 ? 7 : jsDay;
      const inRange = flashSale.startDate <= startDate && startDate <= flashSale.endDate;
      const inDayOfWeek = flashSale.daysOfWeek.includes(dayOfWeek);
      const inTimeWindow = time >= flashSale.timeStart && time < flashSale.timeEnd;
      if (inRange && inDayOfWeek && inTimeWindow) {
        basePrice = Math.round(service.price * (1 - flashSale.discountPercent / 100) * 100) / 100;
        validFlashSaleId = flashSale.id;
      }
    }
  }

  // Fidelidade (Bloco 3 Parte 3.4): se o serviço agendado é o prêmio de uma
  // regra ativa e o cliente já tem pontos suficientes, aplica automaticamente
  // (não empilha com desconto de feirão — o cliente escolhe o melhor dos dois).
  let loyaltyApplied = false;
  if (!validFlashSaleId) {
    const reward = await tryRedeemLoyaltyReward(bookingToken.businessId, bookingToken.client, service.id);
    if (reward) {
      basePrice = Math.round(basePrice * (1 - reward.discountPercent / 100) * 100) / 100;
      loyaltyApplied = true;
    }
  }

  const isLocal = paymentMethod === "local";
  const discount = paymentMethod === "pix" ? Math.round(basePrice * 0.05 * 100) / 100 : 0;

  const appointment = await prisma.appointment.create({
    data: {
      businessId: bookingToken.businessId,
      clientId: bookingToken.client.id,
      serviceId: service.id,
      professionalId,
      date: startDate,
      endTime: endDate,
      status: isLocal ? "CONFIRMED" : "PENDING_CONFIRMATION",
      source: validFlashSaleId ? "FLASH_SALE" : "WHATSAPP",
      price: basePrice - discount,
      paymentMethod,
      paymentStatus: isLocal ? "PENDING" : "PENDING",
      paymentDiscount: service.price - (basePrice - discount),
      flashSaleId: validFlashSaleId,
      loyaltyRewardApplied: loyaltyApplied,
    },
    include: { client: true, service: true, professional: true },
  });

  if (validFlashSaleId) {
    await prisma.flashSale.update({ where: { id: validFlashSaleId }, data: { bookedCount: { increment: 1 } } });
  }

  await prisma.bookingToken.update({ where: { id: bookingToken.id }, data: { usedAt: new Date() } });

  if (isLocal) {
    await notifyClientConfirmed(appointment);
  }

  return NextResponse.json({
    appointmentId: appointment.id,
    status: appointment.status,
    price: appointment.price,
    loyaltyRewardApplied: loyaltyApplied,
  });
}
