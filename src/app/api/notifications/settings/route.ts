/**
 * GET/PUT /api/notifications/settings — toggles de notificação do dono
 * (Bloco 3 Parte 5.2), gravados em Owner.notifyOn. Todo toggle ausente é
 * tratado como "ligado" por padrão (ver src/lib/notify.ts).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

const DEFAULT_NOTIFY_ON = {
  newAppointment: true,
  payment: true,
  humanRequested: true,
  cancellation: true,
  noShowRisk: true,
  dailyReport: true,
  monthlyReport: true,
  sentimentAlert: true,
  channel: "both",
};

export async function GET() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const owner = await prisma.owner.findUnique({ where: { businessId } });
  if (!owner) return NextResponse.json({ error: "Dono não encontrado." }, { status: 404 });

  return NextResponse.json({ ...DEFAULT_NOTIFY_ON, ...((owner.notifyOn as any) ?? {}) });
}

export async function PUT(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const body = await req.json();
  const owner = await prisma.owner.findUnique({ where: { businessId } });
  if (!owner) return NextResponse.json({ error: "Dono não encontrado." }, { status: 404 });

  const notifyOn = { ...DEFAULT_NOTIFY_ON, ...((owner.notifyOn as any) ?? {}), ...body };
  await prisma.owner.update({ where: { id: owner.id }, data: { notifyOn } });

  return NextResponse.json(notifyOn);
}
