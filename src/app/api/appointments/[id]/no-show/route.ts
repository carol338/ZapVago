/**
 * PUT /api/appointments/[id]/no-show — marca falta.
 * Atualiza contadores do cliente (noShowCount, noShowRate) e aplica
 * regras do Modo Silencioso (ex: exigir pagamento antecipado após 3 faltas).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { applySilentRules } from "@/lib/silent-mode";
import { recalculateClientFutureRisk } from "@/lib/noshow";

export async function PUT(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const appointment = await prisma.appointment.findFirst({ where: { id: params.id, businessId }, include: { client: true } });
  if (!appointment) return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });

  await prisma.appointment.update({ where: { id: params.id }, data: { status: "NO_SHOW" } });

  const newNoShowCount = appointment.client.noShowCount + 1;
  const newTotalVisits = appointment.client.totalVisits + 1;
  await prisma.client.update({
    where: { id: appointment.clientId },
    data: {
      noShowCount: newNoShowCount,
      totalVisits: newTotalVisits,
      noShowRate: newTotalVisits > 0 ? newNoShowCount / newTotalVisits : 0,
    },
  });

  await applySilentRules(businessId, appointment.clientId);
  await recalculateClientFutureRisk(appointment.clientId);

  return NextResponse.json({ ok: true });
}
