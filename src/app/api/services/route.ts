/**
 * GET  /api/services — lista serviços do negócio
 * POST /api/services — cria um novo serviço (ou combo, se comboOf for informado)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function GET() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const services = await prisma.service.findMany({
    where: { businessId },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const body = await req.json();
  const service = await prisma.service.create({
    data: {
      businessId,
      name: body.name,
      duration: body.duration,
      price: body.price,
      color: body.color ?? "#4F46E5",
      category: body.category,
      comboOf: body.comboOf ?? [],
      comboDiscount: body.comboDiscount,
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(service, { status: 201 });
}
