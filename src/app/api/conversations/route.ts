/** GET /api/conversations?status=&sentiment= — lista conversas (para o painel de atendimento e sentimentos). */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const sentiment = searchParams.get("sentiment");

  const conversations = await prisma.conversation.findMany({
    where: {
      businessId,
      ...(status ? { status: status as any } : {}),
      ...(sentiment ? { sentiment } : {}),
    },
    include: { client: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(conversations);
}
