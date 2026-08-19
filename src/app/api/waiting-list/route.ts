/** GET/POST /api/waiting-list — Bloco 3 Parte 1 (Lista de Espera Ativa). */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { hasFeature } from "@/lib/plan-limits";
import { expireStaleWaitingListOffers } from "@/lib/waiting-list";

export async function GET() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  // Varre ofertas vencidas antes de listar, já que não há worker 24/7 nesse ambiente.
  await expireStaleWaitingListOffers();

  const entries = await prisma.waitingListEntry.findMany({
    where: { businessId },
    include: { client: true, service: true },
    orderBy: { createdAt: "asc" },
  });

  // Fila ativa primeiro (VIP, depois quem espera há mais tempo); resolvidos
  // (agendados/recusados) aparecem depois, mais recentes primeiro — é
  // histórico, não fila de verdade.
  const sorted = entries.sort((a, b) => {
    const aResolved = a.resolvedAt ? 1 : 0;
    const bResolved = b.resolvedAt ? 1 : 0;
    if (aResolved !== bResolved) return aResolved - bResolved;
    if (aResolved && bResolved) return b.resolvedAt!.getTime() - a.resolvedAt!.getTime();

    const aVip = a.client.tags.includes("vip") ? 0 : 1;
    const bVip = b.client.tags.includes("vip") ? 0 : 1;
    if (aVip !== bVip) return aVip - bVip;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return NextResponse.json(sorted);
}

export async function POST(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  if (!(await hasFeature(businessId, "waitingList"))) {
    return NextResponse.json({ error: "Lista de espera não está disponível no seu plano. Faça upgrade para liberar." }, { status: 403 });
  }

  const body = await req.json();

  let clientId = body.clientId as string | undefined;
  if (!clientId && body.clientName && body.clientPhone) {
    const client = await prisma.client.upsert({
      where: { businessId_phone: { businessId, phone: body.clientPhone } },
      update: {},
      create: { businessId, name: body.clientName, phone: body.clientPhone, tags: ["novo"] },
    });
    clientId = client.id;
  }
  if (!clientId || !body.serviceId || !body.preferredDate) {
    return NextResponse.json({ error: "Cliente, serviço e data preferida são obrigatórios." }, { status: 400 });
  }

  const entry = await prisma.waitingListEntry.create({
    data: {
      businessId,
      clientId,
      serviceId: body.serviceId,
      preferredDate: new Date(body.preferredDate),
      flexibleDates: body.flexibleDates ?? true,
      preferredPeriod: body.preferredPeriod,
    },
    include: { client: true, service: true },
  });
  return NextResponse.json(entry, { status: 201 });
}
