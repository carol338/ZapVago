/**
 * POST /api/cron/monthly-report — alternativa ao BullMQ para ambientes serverless
 * (ex: Vercel Cron). Chame no dia 1 às 08h com header Authorization: Bearer CRON_SECRET.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { buildMonthlyReportMessage } from "@/lib/reports";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const owners = await prisma.owner.findMany({ include: { business: true } });
  let sent = 0;

  for (const owner of owners) {
    const notifyOn = (owner.notifyOn as any) || {};
    if (notifyOn.weeklyReport === false && notifyOn.dailyReport === false) continue;
    const message = await buildMonthlyReportMessage(owner.businessId);
    await sendWhatsAppMessage(owner.phone, message);
    sent += 1;
  }

  return NextResponse.json({ ok: true, sent });
}
