/** GET /api/clients/[id]/prontuario — preferências e previsão de retorno calculadas a partir do histórico. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { computeProntuario } from "@/lib/prontuario";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const client = await prisma.client.findFirst({ where: { id: params.id, businessId } });
  if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

  const prontuario = await computeProntuario(params.id);
  return NextResponse.json(prontuario);
}
