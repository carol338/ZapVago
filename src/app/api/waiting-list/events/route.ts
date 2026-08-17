/**
 * GET /api/waiting-list/events — log de eventos da Lista de Espera Ativa
 * (cancelamento → notificação → resposta → agendamento), pra acompanhar o
 * fluxo completo no painel sem depender do WhatsApp real.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function GET() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const events = await prisma.waitingListEvent.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(events);
}
