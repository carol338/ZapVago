/**
 * POST /api/flash-sales/[id]/activate — dispara as mensagens do feirão.
 * Regra de negócio 9: só envia para clientes que não agendaram no período definido.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { resolveFlashSaleAudience } from "@/lib/flash-sale-audience";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const flashSale = await prisma.flashSale.findFirst({ where: { id: params.id, businessId } });
  if (!flashSale) return NextResponse.json({ error: "Feirão não encontrado." }, { status: 404 });

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/${business?.slug}/agendar?flashSale=${flashSale.id}`;

  const clients = await resolveFlashSaleAudience(businessId, flashSale.targetClients, flashSale.startDate, flashSale.endDate);

  let sent = 0;
  for (const c of clients) {
    const msg =
      (flashSale.message || `🔥 ${flashSale.name}! ${flashSale.discountPercent}% OFF hoje. Bora garantir seu horário?`) +
      `\n\n👉 ${link}`;
    const result = await sendWhatsAppMessage(c.phone, msg);
    if (result.success) sent += 1;
  }

  await prisma.flashSale.update({ where: { id: params.id }, data: { sentCount: { increment: sent } } });

  return NextResponse.json({ ok: true, sent, link });
}
