/** POST /api/clients/[id]/send-return-message — dispara mensagem de retorno pro cliente atrasado. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { computeProntuario } from "@/lib/prontuario";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const client = await prisma.client.findFirst({ where: { id: params.id, businessId } });
  if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

  const prontuario = await computeProntuario(params.id);
  const profissional = prontuario.professionalPreferido?.name ?? "a gente";
  const dias = prontuario.diasAtrasado;

  const primeiro = client.name.split(" ")[0];
  const msg = `${primeiro}, já faz ${dias} dias desde sua última visita. ${profissional === "a gente" ? "Estamos" : `${profissional} está`} com horários disponíveis essa semana. Quer agendar?`;

  const result = await sendWhatsAppMessage(client.phone, msg, businessId);
  await prisma.client.update({ where: { id: client.id }, data: { lastContactedAt: new Date() } });

  return NextResponse.json({ ok: true, mocked: result.mocked, message: msg });
}
