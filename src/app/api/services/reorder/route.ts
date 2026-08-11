/** PUT /api/services/reorder — recebe [{id, order}] e atualiza a ordem de exibição. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function PUT(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const { items }: { items: { id: string; order: number }[] } = await req.json();
  await Promise.all(
    items.map((item) => prisma.service.updateMany({ where: { id: item.id, businessId }, data: { order: item.order } }))
  );
  return NextResponse.json({ ok: true });
}
