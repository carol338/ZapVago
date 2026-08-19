/**
 * POST /api/waiting-list/[id]/notify — notificação manual (botão no painel).
 * Diferente da oferta automática (que já vem com uma vaga real de um
 * cancelamento), esse aviso é um "check-in" do dono com o cliente — não
 * marca a entrada como `notified`, então ela continua elegível pra receber
 * a oferta automática de verdade quando uma vaga abrir.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { hasFeature } from "@/lib/plan-limits";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  if (!(await hasFeature(businessId, "waitingList"))) {
    return NextResponse.json({ error: "Lista de espera não está disponível no seu plano." }, { status: 403 });
  }

  const entry = await prisma.waitingListEntry.findFirst({
    where: { id: params.id, businessId },
    include: { client: true, service: true },
  });
  if (!entry) return NextResponse.json({ error: "Entrada não encontrada." }, { status: 404 });

  const msg = `Oi ${entry.client.name.split(" ")[0]}! Você ainda está na nossa lista de espera pra ${entry.service.name}. Avisamos assim que abrir uma vaga — se não quiser mais esperar, é só falar aqui. 🙏`;
  await sendWhatsAppMessage(entry.client.phone, msg, businessId);

  return NextResponse.json({ ok: true });
}
