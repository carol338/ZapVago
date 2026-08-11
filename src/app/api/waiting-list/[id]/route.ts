import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  await prisma.waitingListEntry.deleteMany({ where: { id: params.id, businessId } });
  return NextResponse.json({ ok: true });
}
