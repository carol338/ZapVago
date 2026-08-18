/**
 * GET/POST /api/cron/monthly-report — processa o relatório mensal
 * diretamente no banco, sem fila (BullMQ não roda em ambiente serverless
 * da Vercel — o worker em src/lib/worker.ts continua existindo só para
 * desenvolvimento local com Redis). Registrado no vercel.json pra rodar
 * dia 1 de cada mês às 08h; GET existe porque é o método que o Vercel
 * Cron (e a maioria dos crons externos) usa por padrão.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildMonthlyReportMessage } from "@/lib/reports";
import { notifyOwner } from "@/lib/notify";
import { requireCronSecret } from "@/lib/cron-auth";

/** Envia o relatório mensal pra todos os negócios ativos — chamado pelo Vercel Cron (dia 1, 08h — ver vercel.json). */
async function sendMonthlyReports(req: NextRequest): Promise<NextResponse> {
  const unauthorized = requireCronSecret(req);
  if (unauthorized) return unauthorized;

  const owners = await prisma.owner.findMany();
  let sent = 0;

  for (const owner of owners) {
    const message = await buildMonthlyReportMessage(owner.businessId);
    await notifyOwner(owner.businessId, "monthlyReport", message);
    await prisma.owner.update({ where: { id: owner.id }, data: { lastMonthlyReportAt: new Date() } });
    sent += 1;
  }

  return NextResponse.json({ success: true, sent });
}

export async function GET(req: NextRequest) {
  return sendMonthlyReports(req);
}

export async function POST(req: NextRequest) {
  return sendMonthlyReports(req);
}
