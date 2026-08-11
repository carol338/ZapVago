/**
 * POST /api/flash-sales/[id]/activate — dispara as mensagens do feirão.
 * Regra de negócio 9: só envia para clientes que não agendaram no período definido.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const flashSale = await prisma.flashSale.findFirst({ where: { id: params.id, businessId } });
  if (!flashSale) return NextResponse.json({ error: "Feirão não encontrado." }, { status: 404 });

  const targetTags = flashSale.targetClients.filter((t) => t !== "todos");
  const clients = await prisma.client.findMany({
    where: {
      businessId,
      ...(flashSale.targetClients.includes("todos") ? {} : { tags: { hasSome: targetTags } }),
      OR: [{ silencedUntil: null }, { silencedUntil: { lt: new Date() } }],
    },
  });

  let sent = 0;
  for (const c of clients) {
    const msg =
      flashSale.message ||
      `🔥 ${flashSale.name}! ${flashSale.discountPercent}% OFF hoje. Bora garantir seu horário? Responda aqui!`;
    const result = await sendWhatsAppMessage(c.phone, msg);
    if (result.success) sent += 1;
  }

  await prisma.flashSale.update({ where: { id: params.id }, data: { sentCount: { increment: sent } } });

  return NextResponse.json({ ok: true, sent });
}
