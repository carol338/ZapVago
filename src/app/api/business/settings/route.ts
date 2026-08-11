/**
 * PUT /api/business/settings — atualiza o JSON de configurações
 * (horários de funcionamento, bloqueios, duração de slot, etc — Etapa 3 do onboarding).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function PUT(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const settings = await req.json();
  const updated = await prisma.business.update({
    where: { id: businessId },
    data: { settings },
  });
  return NextResponse.json(updated);
}
