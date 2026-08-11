/** GET/POST /api/waiting-list — Diferencial 2 (Lista de Espera Ativa). */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function GET() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const entries = await prisma.waitingListEntry.findMany({
    where: { businessId },
    include: { client: true, service: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const body = await req.json();
  const entry = await prisma.waitingListEntry.create({
    data: {
      businessId,
      clientId: body.clientId,
      serviceId: body.serviceId,
      preferredDate: new Date(body.preferredDate),
      flexibleDates: body.flexibleDates ?? true,
      preferredPeriod: body.preferredPeriod,
    },
  });
  return NextResponse.json(entry, { status: 201 });
}
