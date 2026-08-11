/** GET /api/reports/monthly?month=&year= — "Receita do Mês" em formato JSON para a tela de Relatórios. */
import { NextRequest, NextResponse } from "next/server";
import { requireBusinessId } from "@/lib/api-auth";
import { buildMonthlyReportMessage } from "@/lib/reports";

export async function GET(_req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const message = await buildMonthlyReportMessage(businessId);
  return NextResponse.json({ message });
}
