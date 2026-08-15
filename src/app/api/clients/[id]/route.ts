/** GET /api/clients/[id] — perfil completo com histórico; PUT atualiza dados/preferências/alergias. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { calculateNoShowRisk } from "@/lib/noshow";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const client = await prisma.client.findFirst({
    where: { id: params.id, businessId },
    include: {
      appointments: { include: { service: true, professional: true }, orderBy: { date: "desc" } },
      conversations: { orderBy: { updatedAt: "desc" }, take: 10 },
    },
  });
  if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

  // Risco geral do cliente (perfil), calculado com a mesma fórmula do risco por
  // agendamento — assume clientConfirmed:true pra refletir o padrão histórico dele,
  // não um lembrete específico não respondido.
  const predictedNoShowRisk = calculateNoShowRisk({ client, clientConfirmed: true });

  return NextResponse.json({ ...client, predictedNoShowRisk });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const body = await req.json();
  const updated = await prisma.client.updateMany({
    where: { id: params.id, businessId },
    data: {
      name: body.name,
      notes: body.notes,
      tags: body.tags,
      alergias: body.alergias,
      preferencias: body.preferencias,
      language: body.language,
    },
  });
  return NextResponse.json(updated);
}
