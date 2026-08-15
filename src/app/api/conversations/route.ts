/** GET /api/conversations?tab=&status=&sentiment=&search= — lista conversas (atendimento e sentimentos). */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const sentiment = searchParams.get("sentiment");
  const tab = searchParams.get("tab"); // "bot" | "attention" | "you"
  const search = searchParams.get("search")?.trim();

  const where: Prisma.ConversationWhereInput = {
    businessId,
    ...(status ? { status: status as any } : {}),
    ...(sentiment ? { sentiment } : {}),
  };

  if (tab === "bot") where.status = "BOT_HANDLING";
  else if (tab === "attention") where.OR = [{ needsAttention: true }, { status: "NEEDS_HUMAN" }];
  else if (tab === "you") where.status = "HUMAN_HANDLING";

  if (search) {
    const searchFilter: Prisma.ConversationWhereInput = {
      OR: [
        { clientName: { contains: search, mode: "insensitive" } },
        { clientPhone: { contains: search } },
      ],
    };
    // combina com o OR da aba "attention" sem sobrescrever
    if (where.OR) {
      where.AND = [{ OR: where.OR }, searchFilter];
      delete where.OR;
    } else {
      where.OR = searchFilter.OR;
    }
  }

  const conversations = await prisma.conversation.findMany({
    where,
    include: { client: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(conversations);
}
