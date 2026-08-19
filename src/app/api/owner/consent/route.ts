/**
 * POST /api/owner/consent — LGPD: registra a ciência do dono, no onboarding,
 * de que o ZapVago armazena dados pessoais de clientes finais e de que ele é
 * o responsável (controlador) pelo tratamento desses dados.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const body = await req.json().catch(() => ({}));
  if (body.ack !== true) {
    return NextResponse.json({ error: "É preciso confirmar a ciência sobre o tratamento de dados dos clientes." }, { status: 400 });
  }

  await prisma.owner.update({ where: { businessId }, data: { dataProcessingAckAt: new Date() } });
  return NextResponse.json({ ok: true });
}
