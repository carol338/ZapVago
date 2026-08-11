/** GET/POST /api/flash-sales — Diferencial 6 (Modo Feirão). */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function GET() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const flashSales = await prisma.flashSale.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(flashSales);
}

export async function POST(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const body = await req.json();
  const flashSale = await prisma.flashSale.create({
    data: {
      businessId,
      name: body.name,
      discountPercent: body.discountPercent,
      serviceIds: body.serviceIds ?? [],
      professionalIds: body.professionalIds ?? [],
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      daysOfWeek: body.daysOfWeek ?? [],
      timeStart: body.timeStart,
      timeEnd: body.timeEnd,
      targetClients: body.targetClients ?? ["todos"],
      message: body.message,
    },
  });
  return NextResponse.json(flashSale, { status: 201 });
}
