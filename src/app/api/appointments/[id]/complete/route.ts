/**
 * PUT /api/appointments/[id]/complete — marca como concluído.
 * Atualiza histórico do cliente (visitas, gasto total, intervalo médio,
 * pontos de fidelidade) — base do Prontuário Inteligente e da Fidelidade Automática.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { differenceInDays } from "date-fns";
import { recalculateClientFutureRisk } from "@/lib/noshow";

export async function PUT(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const appointment = await prisma.appointment.findFirst({
    where: { id: params.id, businessId },
    include: { client: true, service: true },
  });
  if (!appointment) return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });

  await prisma.appointment.update({ where: { id: params.id }, data: { status: "COMPLETED" } });

  const client = appointment.client;
  const newTotalVisits = client.totalVisits + 1;
  const newTotalSpent = client.totalSpent + appointment.service.price;

  let newAvgInterval = client.avgIntervalDays;
  if (client.lastVisitAt) {
    const gap = differenceInDays(appointment.date, client.lastVisitAt);
    newAvgInterval = client.avgIntervalDays ? (client.avgIntervalDays + gap) / 2 : gap;
  }

  await prisma.client.update({
    where: { id: client.id },
    data: {
      totalVisits: newTotalVisits,
      totalSpent: newTotalSpent,
      lastVisitAt: appointment.date,
      lastContactedAt: new Date(),
      avgIntervalDays: newAvgInterval,
      loyaltyPoints: { increment: 1 },
      noShowRate: newTotalVisits > 0 ? client.noShowCount / newTotalVisits : 0,
    },
  });

  await recalculateClientFutureRisk(client.id);

  return NextResponse.json({ ok: true });
}
