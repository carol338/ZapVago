import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { canAddProfessional } from "@/lib/plan-limits";

export async function GET() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const professionals = await prisma.professional.findMany({ where: { businessId } });
  return NextResponse.json(professionals);
}

export async function POST(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const limitCheck = await canAddProfessional(businessId);
  if (!limitCheck.allowed) {
    const planLabel = limitCheck.plan === "FREE" ? "Grátis" : "Pro";
    return NextResponse.json(
      { error: `Limite de ${limitCheck.limit} profissional(is) do plano ${planLabel} atingido. Faça upgrade para adicionar mais.`, planLimit: limitCheck },
      { status: 403 }
    );
  }

  const body = await req.json();
  const professional = await prisma.professional.create({
    data: {
      businessId,
      name: body.name,
      color: body.color ?? "#10B981",
      serviceIds: body.serviceIds ?? [],
    },
  });
  return NextResponse.json(professional, { status: 201 });
}
