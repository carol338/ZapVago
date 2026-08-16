/**
 * GET /api/loyalty/summary — dados do card "🎁 Fidelidade" no dashboard
 * (Bloco 3 Parte 3.5): quantos clientes já podem resgatar um prêmio agora,
 * e quantos prêmios foram usados esse mês.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { startOfMonth } from "date-fns";

export async function GET() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const rules = await prisma.loyaltyRule.findMany({ where: { businessId, active: true } });
  const minVisits = rules.length > 0 ? Math.min(...rules.map((r) => r.visitsRequired)) : null;

  const eligibleClients = minVisits
    ? await prisma.client.count({ where: { businessId, loyaltyPoints: { gte: minVisits } } })
    : 0;

  const rewardsThisMonth = await prisma.appointment.count({
    where: { businessId, loyaltyRewardApplied: true, createdAt: { gte: startOfMonth(new Date()) } },
  });

  return NextResponse.json({ eligibleClients, rewardsThisMonth, hasRules: rules.length > 0 });
}
