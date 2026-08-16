/** GET/POST /api/waiting-list — Bloco 3 Parte 1 (Lista de Espera Ativa). */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
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

  // Ordena por prioridade: VIP primeiro, depois quem espera há mais tempo.
  const sorted = entries.sort((a, b) => {
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
