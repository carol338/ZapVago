import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const body = await req.json();
  const service = await prisma.service.updateMany({
    where: { id: params.id, businessId },
    data: body,
  });
  return NextResponse.json(service);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  await prisma.service.updateMany({
    where: { id: params.id, businessId },
    data: { active: false },
  });
  return NextResponse.json({ ok: true });
}
