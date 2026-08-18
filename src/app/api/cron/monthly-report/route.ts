/**
 * GET/POST /api/cron/monthly-report — alternativa ao BullMQ para ambientes
 * serverless (ex: Vercel Cron). Chame no dia 1 às 08h com header
 * Authorization: Bearer CRON_SECRET.
 *
 * O Vercel Cron dispara com GET (e injeta esse header automaticamente
 * quando CRON_SECRET está configurado no projeto) — por isso GET precisa
 * existir aqui, não só POST. Mantemos POST também, pra quem preferir
 * chamar via cron externo (cron-job.org, GitHub Actions etc.) com POST.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildMonthlyReportMessage } from "@/lib/reports";
import { notifyOwner } from "@/lib/notify";

/** Envia o relatório mensal pra todos os negócios ativos — chamado pelo Vercel Cron (dia 1, 08h — ver vercel.json). */
async function sendMonthlyReports(req: NextRequest): Promise<NextResponse> {
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

export async function GET(req: NextRequest) {
  return sendMonthlyReports(req);
}

export async function POST(req: NextRequest) {
  return sendMonthlyReports(req);
}
