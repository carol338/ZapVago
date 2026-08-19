/** GET/POST /api/loyalty/rules — Diferencial 10 (Fidelidade Automática). */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { hasFeature } from "@/lib/plan-limits";

export async function GET() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const rules = await prisma.loyaltyRule.findMany({ where: { businessId } });
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  if (!(await hasFeature(businessId, "loyalty"))) {
    return NextResponse.json({ error: "Fidelidade não está disponível no seu plano. Faça upgrade para liberar." }, { status: 403 });
  }

  const body = await req.json();
  const rule = await prisma.loyaltyRule.create({
    data: {
      businessId,
      visitsRequired: body.visitsRequired,
      rewardServiceId: body.rewardServiceId,
      rewardDiscount: body.rewardDiscount,
    },
  });
  return NextResponse.json(rule, { status: 201 });
}
