import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const conversation = await prisma.conversation.findFirst({ where: { id: params.id, businessId }, include: { client: true } });
  if (!conversation) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
  return NextResponse.json(conversation);
}
