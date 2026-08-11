/** GET /api/reports/sentiment?period= — Diferencial 4 (Painel de Sentimentos). */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const { searchParams } = new URL(req.url);
  const period = Number(searchParams.get("period") ?? 7);

  const conversations = await prisma.conversation.findMany({
    where: { businessId, updatedAt: { gte: subDays(new Date(), period) } },
    include: { client: true },
  });

  const positivos = conversations.filter((c) => c.sentiment === "positive").length;
  const neutros = conversations.filter((c) => c.sentiment === "neutral").length;
  const negativos = conversations.filter((c) => c.sentiment === "negative");

  const total = conversations.length || 1;

  return NextResponse.json({
    total: conversations.length,
    positivos,
    positivosPct: Math.round((positivos / total) * 100),
    neutros,
    neutrosPct: Math.round((neutros / total) * 100),
    negativos: negativos.length,
    negativosPct: Math.round((negativos.length / total) * 100),
    clientesInsatisfeitos: negativos.map((c) => ({
      id: c.id,
      clientName: c.clientName ?? c.client?.name ?? "Desconhecido",
      summary: c.summary,
    })),
  });
}
