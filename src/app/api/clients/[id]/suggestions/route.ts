/**
 * GET /api/clients/[id]/suggestions?serviceId= — upsell automático.
 * Se existe um combo cadastrado que inclui esse serviço, sugere. Também
 * verifica se o cliente já agendou esse serviço + outro juntos 2+ vezes.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { isSameDay } from "date-fns";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");
  if (!serviceId) return NextResponse.json({ error: "serviceId é obrigatório." }, { status: 400 });

  const client = await prisma.client.findFirst({ where: { id: params.id, businessId } });
  if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

  // 1) Combo já cadastrado que inclui esse serviço
  const combo = await prisma.service.findFirst({
    where: { businessId, active: true, comboOf: { has: serviceId } },
  });

  if (combo) {
    const base = await prisma.service.findUnique({ where: { id: serviceId } });
    const economia = base ? Math.round((base.price - combo.price) * 100) / 100 : null;
    return NextResponse.json({
      suggestion: {
        type: "combo",
        serviceId: combo.id,
        name: combo.name,
        price: combo.price,
        discountPercent: combo.comboDiscount,
        economia: economia && economia > 0 ? economia : null,
      },
    });
  }

  // 2) Padrão histórico: agendou esse serviço junto com outro no mesmo dia, 2+ vezes
  const appointments = await prisma.appointment.findMany({
    where: { clientId: params.id, businessId, status: { not: "CANCELLED" } },
    include: { service: true },
    orderBy: { date: "asc" },
  });

  const pairCounts = new Map<string, { name: string; count: number }>();
  for (let i = 0; i < appointments.length; i++) {
    for (let j = i + 1; j < appointments.length; j++) {
      if (!isSameDay(appointments[i].date, appointments[j].date)) continue;
      const a = appointments[i];
      const b = appointments[j];
      const otherId = a.serviceId === serviceId ? b.serviceId : b.serviceId === serviceId ? a.serviceId : null;
      const otherName = a.serviceId === serviceId ? b.service.name : b.serviceId === serviceId ? a.service.name : null;
      if (!otherId || !otherName) continue;
      const entry = pairCounts.get(otherId) ?? { name: otherName, count: 0 };
      entry.count++;
      pairCounts.set(otherId, entry);
    }
  }

  const top = [...pairCounts.entries()].sort((a, b) => b[1].count - a[1].count)[0];
  if (top && top[1].count >= 2) {
    return NextResponse.json({
      suggestion: { type: "pair", serviceId: top[0], name: top[1].name, count: top[1].count },
    });
  }

  return NextResponse.json({ suggestion: null });
}
