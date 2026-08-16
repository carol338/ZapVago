/**
 * POST /api/cron/monthly-report — alternativa ao BullMQ para ambientes serverless
 * (ex: Vercel Cron). Chame no dia 1 às 08h com header Authorization: Bearer CRON_SECRET.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildMonthlyReportMessage } from "@/lib/reports";
import { notifyOwner } from "@/lib/notify";

/**
 * Envia o relatório mensal pra todos os negócios ativos. Chamado pelo Vercel
 * Cron (dia 1, 08h — ver vercel.json) e também disponível para disparo manual
 * de um único negócio via POST /api/reports/monthly/send.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const owners = await prisma.owner.findMany();
  let sent = 0;

  for (const owner of owners) {
    const message = await buildMonthlyReportMessage(owner.businessId);
    await notifyOwner(owner.businessId, "monthlyReport", message);
    await prisma.owner.update({ where: { id: owner.id }, data: { lastMonthlyReportAt: new Date() } });
    sent += 1;
  }

  return NextResponse.json({ ok: true, sent });
}
