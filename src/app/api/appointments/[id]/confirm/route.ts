/** PUT /api/appointments/[id]/confirm — cliente confirmou presença via WhatsApp ou painel. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { recalculateClientFutureRisk } from "@/lib/noshow";

export async function PUT(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const appointment = await prisma.appointment.findFirst({ where: { id: params.id, businessId } });
  if (!appointment) return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });

  const updated = await prisma.appointment.updateMany({
    where: { id: params.id, businessId },
    data: { clientConfirmed: true, status: "CONFIRMED" },
  });

  await recalculateClientFutureRisk(appointment.clientId);

  return NextResponse.json({ ok: true, updated });
}
