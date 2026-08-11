import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function GET() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const professionals = await prisma.professional.findMany({ where: { businessId } });
  return NextResponse.json(professionals);
}

export async function POST(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

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
