/**
 * GET  /api/business/whatsapp-config — status da conexão (nunca retorna o
 *      accessToken pro frontend, só se está conectado e qual phoneNumberId).
 * POST /api/business/whatsapp-config — salva phoneNumberId/accessToken em
 *      Business.whatsappProviderConfig e marca whatsappConnected = true.
 *      É isso que sendWhatsAppMessage() usa pra enviar em nome desse
 *      negócio específico, e que o webhook usa pra descobrir qual negócio
 *      recebeu uma mensagem. Testar se as credenciais realmente funcionam
 *      é responsabilidade de POST /api/business/whatsapp-test, separado
 *      de propósito — dá pra salvar e testar de novo depois sem reenviar
 *      o token toda vez.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

const schema = z.object({
  phoneNumberId: z
    .string()
    .trim()
    .min(1, "Phone Number ID é obrigatório.")
    .regex(/^\d+$/, "Phone Number ID deve conter apenas números."),
  accessToken: z
    .string()
    .trim()
    .min(1, "Token de acesso é obrigatório.")
    .min(20, "Token de acesso muito curto — confira se copiou o token completo."),
});

export async function GET() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { whatsappConnected: true, whatsappProviderConfig: true },
  });
  const config = business?.whatsappProviderConfig as { phoneNumberId?: string } | null;

  return NextResponse.json({
    connected: !!business?.whatsappConnected,
    phoneNumberId: config?.phoneNumberId ?? null,
  });
}

export async function POST(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos.", details: parsed.error.issues }, { status: 400 });
  }
  const { phoneNumberId, accessToken } = parsed.data;

  await prisma.business.update({
    where: { id: businessId },
    data: { whatsappProviderConfig: { phoneNumberId, accessToken }, whatsappConnected: true },
  });

  return NextResponse.json({ saved: true });
}
