/**
 * GET/POST /api/cron/reminders — processa lembretes diretamente no banco,
 * sem fila (BullMQ não roda em ambiente serverless da Vercel — o worker em
 * src/lib/worker.ts continua existindo só para desenvolvimento local com
 * Redis). Registrado no vercel.json pra rodar a cada 15min; GET existe
 * porque é o método que o Vercel Cron (e a maioria dos crons externos)
 * usa por padrão.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { addHours } from "date-fns";
import { requireCronSecret } from "@/lib/cron-auth";

async function sendDueReminders(req: NextRequest): Promise<NextResponse> {
  const unauthorized = requireCronSecret(req);
  if (unauthorized) return unauthorized;

  const now = new Date();

  const due24h = await prisma.appointment.findMany({
    where: {
      status: { in: ["CONFIRMED", "PENDING_CONFIRMATION"] },
      reminderSent24: false,
      date: { lte: addHours(now, 24), gt: now },
    },
    include: { client: true, service: true, professional: true },
  });
  const due1h = await prisma.appointment.findMany({
    where: {
      status: { in: ["CONFIRMED", "PENDING_CONFIRMATION"] },
      reminderSent1: false,
      date: { lte: addHours(now, 1), gt: now },
    },
    include: { client: true, service: true, professional: true },
  });

  for (const a of due24h) {
    await sendWhatsAppMessage(
      a.client.phone,
      `Oi ${a.client.name.split(" ")[0]}! Lembrando do seu ${a.service.name} amanhã com ${a.professional.name} 💈 Confirma presença?`,
      a.businessId
    );
    await prisma.appointment.update({ where: { id: a.id }, data: { reminderSent24: true } });
  }
  for (const a of due1h) {
    await sendWhatsAppMessage(
      a.client.phone,
      `${a.client.name.split(" ")[0]}, seu horário é daqui a 1 hora com ${a.professional.name}! 🕐 Já tá vindo?`,
      a.businessId
    );
    await prisma.appointment.update({ where: { id: a.id }, data: { reminderSent1: true } });
  }

  return NextResponse.json({ success: true, processed: due24h.length + due1h.length, sent24h: due24h.length, sent1h: due1h.length });
}

export async function GET(req: NextRequest) {
  return sendDueReminders(req);
}

export async function POST(req: NextRequest) {
  return sendDueReminders(req);
}
