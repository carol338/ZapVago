/** GET/POST /api/clients/[id]/notes — observações do dono sobre o cliente. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const notes = await prisma.clientNote.findMany({
    where: { clientId: params.id, businessId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const client = await prisma.client.findFirst({ where: { id: params.id, businessId } });
  if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "Escreva algo pra salvar a nota." }, { status: 400 });

  const note = await prisma.clientNote.create({
    data: { businessId, clientId: params.id, text: text.trim() },
  });
  return NextResponse.json(note, { status: 201 });
}
