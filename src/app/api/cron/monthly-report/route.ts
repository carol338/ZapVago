/**
 * GET/POST /api/cron/monthly-report — processa o relatório mensal
 * diretamente no banco, sem fila (BullMQ não roda em ambiente serverless
 * da Vercel — o worker em src/lib/worker.ts continua existindo só para
 * desenvolvimento local com Redis). Registrado no vercel.json pra rodar
 * dia 1 de cada mês às 08h; GET existe porque é o método que o Vercel
 * Cron (e a maioria dos crons externos) usa por padrão.
 *
 * Elegibilidade (antes desta versão, mandava pra TODO Owner sem filtro
 * nenhum — uma conta de teste esquecida no banco de produção recebia
 * relatório igual a uma conta real):
 * - isTestAccount = false (ver Business.isTestAccount)
 * - pelo menos 1 agendamento CONFIRMED ou COMPLETED nos últimos 30 dias
 *   (por Appointment.date, mesmo critério temporal que buildMonthlyReportMessage
 *   usa pra montar o relatório em si — negócio sem movimento recente não
 *   tem o que reportar)
 * - Owner.notifyOn.monthlyReport !== false (mesma convenção do resto do
 *   app: ausente/undefined = ligado por padrão, só false desativa)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildMonthlyReportMessage } from "@/lib/reports";
import { notifyOwner } from "@/lib/notify";
import { requireCronSecret } from "@/lib/cron-auth";
import { subDays } from "date-fns";

type SkipReason = "test_account" | "no_recent_appointments" | "toggle_disabled" | "no_owner";

async function sendMonthlyReports(req: NextRequest): Promise<NextResponse> {
  const unauthorized = requireCronSecret(req);
  if (unauthorized) return unauthorized;

  const since30d = subDays(new Date(), 30);

  const businesses = await prisma.business.findMany({ include: { owner: true } });

  let processed = 0;
  const skipped: Record<SkipReason, string[]> = {
    test_account: [],
    no_recent_appointments: [],
    toggle_disabled: [],
    no_owner: [],
  };

  for (const business of businesses) {
    if (business.isTestAccount) {
      skipped.test_account.push(business.id);
      continue;
    }

    if (!business.owner) {
      skipped.no_owner.push(business.id);
      continue;
    }

    const notifyOn = (business.owner.notifyOn as any) ?? {};
    if (notifyOn.monthlyReport === false) {
      skipped.toggle_disabled.push(business.id);
      continue;
    }

    const hasRecentActivity = await prisma.appointment.findFirst({
      where: { businessId: business.id, status: { in: ["CONFIRMED", "COMPLETED"] }, date: { gte: since30d } },
      select: { id: true },
    });
    if (!hasRecentActivity) {
      skipped.no_recent_appointments.push(business.id);
      continue;
    }

    const message = await buildMonthlyReportMessage(business.id);
    await notifyOwner(business.id, "monthlyReport", message);
    await prisma.owner.update({ where: { id: business.owner.id }, data: { lastMonthlyReportAt: new Date() } });
    processed += 1;
  }

  const totalSkipped = skipped.test_account.length + skipped.no_recent_appointments.length + skipped.toggle_disabled.length + skipped.no_owner.length;
  console.log(
    `[cron/monthly-report] ${processed} enviado(s), ${totalSkipped} pulado(s) de ${businesses.length} negócio(s) no total — ` +
      `conta de teste: ${skipped.test_account.length}, sem agendamento recente: ${skipped.no_recent_appointments.length}, ` +
      `toggle desativado: ${skipped.toggle_disabled.length}, sem dono: ${skipped.no_owner.length}` +
      (skipped.no_recent_appointments.length ? ` [sem movimento: ${skipped.no_recent_appointments.join(", ")}]` : "")
  );

  return NextResponse.json({
    success: true,
    processed,
    skipped: totalSkipped,
    skippedReasons: {
      testAccount: skipped.test_account.length,
      noRecentAppointments: skipped.no_recent_appointments.length,
      toggleDisabled: skipped.toggle_disabled.length,
      noOwner: skipped.no_owner.length,
    },
  });
}

export async function GET(req: NextRequest) {
  return sendMonthlyReports(req);
}

export async function POST(req: NextRequest) {
  return sendMonthlyReports(req);
}
