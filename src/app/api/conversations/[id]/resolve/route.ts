/** POST /api/conversations/[id]/resolve — marca a conversa como resolvida (some da aba "Precisa de atenção"). */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  await prisma.conversation.updateMany({
    where: { id: params.id, businessId },
    data: { status: "RESOLVED", needsAttention: false },
  });
  return NextResponse.json({ ok: true });
}
