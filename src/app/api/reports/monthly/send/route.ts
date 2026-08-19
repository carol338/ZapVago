/**
 * POST /api/reports/monthly/send — disparo manual do relatório "Receita do
 * Mês" pro negócio logado (botão em Relatórios), sem esperar o cron do dia 1.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { hasFeature } from "@/lib/plan-limits";
import { buildMonthlyReportMessage } from "@/lib/reports";
import { notifyOwner } from "@/lib/notify";

export async function POST() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  if (!(await hasFeature(businessId, "advancedReports"))) {
    return NextResponse.json({ error: "Relatórios avançados não estão disponíveis no seu plano." }, { status: 403 });
  }

  const owner = await prisma.owner.findUnique({ where: { businessId } });
  if (!owner) return NextResponse.json({ error: "Dono não encontrado." }, { status: 404 });

  const message = await buildMonthlyReportMessage(businessId);
  const { whatsapp } = await notifyOwner(businessId, "monthlyReport", message);
  await prisma.owner.update({ where: { id: owner.id }, data: { lastMonthlyReportAt: new Date() } });

  return NextResponse.json({ ok: true, message, whatsapp });
}
