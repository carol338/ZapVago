/** POST /api/conversations/[id]/release — devolve a conversa para o bot cuidar. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  await prisma.conversation.updateMany({
    where: { id: params.id, businessId },
    data: { status: "BOT_HANDLING", needsAttention: false },
  });
  return NextResponse.json({ ok: true });
}
