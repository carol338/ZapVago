/**
 * POST /api/cron/reminders — alternativa ao BullMQ para ambientes serverless.
 * Rode a cada 15-30min via cron externo; envia lembretes de 24h e 1h que ainda não foram disparados.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { addHours } from "date-fns";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

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
      `Oi ${a.client.name.split(" ")[0]}! Lembrando do seu ${a.service.name} amanhã com ${a.professional.name} 💈 Confirma presença?`
    );
    await prisma.appointment.update({ where: { id: a.id }, data: { reminderSent24: true } });
  }
  for (const a of due1h) {
    await sendWhatsAppMessage(
      a.client.phone,
      `${a.client.name.split(" ")[0]}, seu horário é daqui a 1 hora com ${a.professional.name}! 🕐 Já tá vindo?`
    );
    await prisma.appointment.update({ where: { id: a.id }, data: { reminderSent1: true } });
  }

  return NextResponse.json({ ok: true, sent24h: due24h.length, sent1h: due1h.length });
}
