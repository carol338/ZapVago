/**
 * POST /api/business/whatsapp-test — envia uma mensagem de teste pro
 * WhatsApp do próprio dono, usando as credenciais já salvas em
 * Business.whatsappProviderConfig. É a única forma real de confirmar que
 * o Phone Number ID e o token de acesso funcionam de verdade — separado
 * do salvamento (POST /api/business/whatsapp-config) pra dar pra testar
 * de novo a qualquer momento sem reenviar o token.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { whatsappProviderConfig: true, owner: true },
  });
  if (!business?.owner) {
    return NextResponse.json({ error: "Dono não encontrado." }, { status: 404 });
  }

  const config = business.whatsappProviderConfig as { phoneNumberId?: string; accessToken?: string } | null;
  if (!config?.phoneNumberId || !config?.accessToken) {
    return NextResponse.json({ error: "Conecte o WhatsApp antes de testar (nenhuma credencial salva ainda)." }, { status: 400 });
  }

  const result = await sendWhatsAppMessage(
    business.owner.phone,
    "✅ ZapVago conectado! A partir de agora, seus clientes podem agendar direto pelo WhatsApp.",
    businessId
  );

  if (!result.success) {
    console.error(`[api/business/whatsapp-test] Teste falhou para o negócio ${businessId}:`, result.error);
    return NextResponse.json(
      { success: false, error: "Não consegui enviar a mensagem de teste. Confira o Phone Number ID e o token de acesso.", details: result.error },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, mocked: result.mocked });
}
