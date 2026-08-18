/**
 * PUT /api/business/whatsapp-config — conecta o WhatsApp Business real do
 * negócio (Etapa 2 do onboarding). Salva phoneNumberId/accessToken em
 * Business.whatsappProviderConfig — é isso que sendWhatsAppMessage() usa
 * pra enviar em nome desse negócio específico, e que o webhook usa pra
 * descobrir qual negócio recebeu uma mensagem.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const schema = z.object({
  phoneNumberId: z.string().trim().min(1, "Phone Number ID é obrigatório."),
  accessToken: z.string().trim().min(1, "Token de acesso é obrigatório."),
});

export async function PUT(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.issues }, { status: 400 });
  }
  const { phoneNumberId, accessToken } = parsed.data;

  const owner = await prisma.owner.findUnique({ where: { businessId } });
  if (!owner) {
    return NextResponse.json({ error: "Dono não encontrado." }, { status: 404 });
  }

  await prisma.business.update({
    where: { id: businessId },
    data: { whatsappProviderConfig: { phoneNumberId, accessToken } },
  });

  // Manda uma mensagem de teste pro próprio dono, já usando as credenciais
  // recém-salvas (sendWhatsAppMessage busca por businessId no banco) — é a
  // única forma real de confirmar que o Phone Number ID/token funcionam.
  const test = await sendWhatsAppMessage(owner.phone, "✅ ZapVago conectado! A partir de agora, seus clientes podem agendar direto pelo WhatsApp.", businessId);

  if (!test.success) {
    console.error(`[api/business/whatsapp-config] Mensagem de teste falhou para o negócio ${businessId}:`, test.error);
    return NextResponse.json(
      {
        saved: true,
        testMessageSent: false,
        error: "As credenciais foram salvas, mas não consegui enviar a mensagem de teste. Confira o Phone Number ID e o token de acesso.",
        details: test.error,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ saved: true, testMessageSent: true, mocked: test.mocked });
}
