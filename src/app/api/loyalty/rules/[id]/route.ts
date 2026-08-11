import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const body = await req.json();
  await prisma.loyaltyRule.updateMany({ where: { id: params.id, businessId }, data: body });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  await prisma.loyaltyRule.deleteMany({ where: { id: params.id, businessId } });
  return NextResponse.json({ ok: true });
}
