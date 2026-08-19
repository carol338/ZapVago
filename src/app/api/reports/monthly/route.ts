/** GET /api/reports/monthly?month=&year= — "Receita do Mês" em formato JSON para a tela de Relatórios. */
import { NextRequest, NextResponse } from "next/server";
import { requireBusinessId } from "@/lib/api-auth";
import { hasFeature } from "@/lib/plan-limits";
import { buildMonthlyReportMessage } from "@/lib/reports";

export async function GET(_req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  if (!(await hasFeature(businessId, "advancedReports"))) {
    return NextResponse.json({ error: "Relatórios avançados não estão disponíveis no seu plano." }, { status: 403 });
  }

  const message = await buildMonthlyReportMessage(businessId);
  return NextResponse.json({ message });
}
