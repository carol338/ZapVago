/** GET /api/reports/sentiment?period=7|15|30|90 — Diferencial 4 (Painel de Sentimentos). */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { subDays } from "date-fns";

function pct(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

export async function GET(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const { searchParams } = new URL(req.url);
  const period = Number(searchParams.get("period") ?? 30);
  const since = subDays(new Date(), period);
  const previousSince = subDays(since, period);

  const [conversations, previousConversations] = await Promise.all([
    prisma.conversation.findMany({ where: { businessId, updatedAt: { gte: since } }, include: { client: true } }),
    prisma.conversation.findMany({ where: { businessId, updatedAt: { gte: previousSince, lt: since } } }),
  ]);

  const positivos = conversations.filter((c) => c.sentiment === "positive").length;
  const neutros = conversations.filter((c) => c.sentiment === "neutral").length;
  const negativos = conversations.filter((c) => c.sentiment === "negative");
  const total = conversations.length || 1;

  const prevNegativos = previousConversations.filter((c) => c.sentiment === "negative").length;
  const prevNegativosPct = pct(prevNegativos, previousConversations.length);
  const negativosPctAtual = pct(negativos.length, total);

  let tendencia: "melhorou" | "piorou" | "estavel" = "estavel";
  if (previousConversations.length > 0) {
    if (negativosPctAtual < prevNegativosPct) tendencia = "melhorou";
    else if (negativosPctAtual > prevNegativosPct) tendencia = "piorou";
  }

  return NextResponse.json({
    period,
    total: conversations.length,
    positivos,
    positivosPct: pct(positivos, total),
    neutros,
    neutrosPct: pct(neutros, total),
    negativos: negativos.length,
    negativosPct: negativosPctAtual,
    tendencia,
    negativosPctPeriodoAnterior: prevNegativosPct,
    clientesInsatisfeitos: negativos.map((c) => ({
      id: c.id,
      clientName: c.clientName ?? c.client?.name ?? "Desconhecido",
      summary: c.summary,
    })),
  });
}
