/** PUT /api/appointments/[id]/confirm — cliente confirmou presença via WhatsApp ou painel. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function PUT(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const updated = await prisma.appointment.updateMany({
    where: { id: params.id, businessId },
    data: { clientConfirmed: true, status: "CONFIRMED" },
  });
  return NextResponse.json({ ok: true, updated });
}
