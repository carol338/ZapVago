/**
 * Wrapper de envio de mensagens via WhatsApp Business Cloud API
 * (através de um provedor como 360dialog ou WapBiz).
 * Em MOCK_MODE, apenas loga a mensagem que seria enviada — útil para
 * testar o fluxo completo sem uma conta WhatsApp Business configurada.
 */
import { createHmac, timingSafeEqual } from "crypto";
import { isMockMode } from "@/lib/mock";

const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET;
const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

export interface SendResult {
  success: boolean;
  mocked: boolean;
  /** Por que foi mockado: MOCK_MODE ligado de propósito, ou WhatsApp nunca configurado. */
  reason?: "mock_mode" | "not_configured";
  messageId?: string;
  error?: string;
}

/** Envia uma mensagem de texto simples para um número de WhatsApp. */
export async function sendWhatsAppMessage(to: string, text: string): Promise<SendResult> {
  if (isMockMode()) {
    console.log(`[whatsapp.ts MOCK] Enviando para ${to}: "${text}"`);
    return { success: true, mocked: true, reason: "mock_mode", messageId: `mock_${Date.now()}` };
  }
  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.log(`[whatsapp.ts MOCK] Enviando para ${to}: "${text}"`);
    return { success: true, mocked: true, reason: "not_configured", messageId: `mock_${Date.now()}` };
  }

  try {
    const res = await fetch(`${GRAPH_API_BASE}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error("[whatsapp.ts] Erro ao enviar mensagem:", json);
      return { success: false, mocked: false, error: JSON.stringify(json) };
    }
    return { success: true, mocked: false, messageId: json.messages?.[0]?.id };
  } catch (err) {
    console.error("[whatsapp.ts] Erro de rede ao enviar mensagem:", err);
    return { success: false, mocked: false, error: String(err) };
  }
}

/** Verifica o webhook (GET) durante o setup do provedor WhatsApp. */
export function verifyWebhook(mode: string | null, token: string | null, challenge: string | null): string | null {
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return challenge;
  }
  return null;
}

/** Normaliza número de telefone para o formato usado como chave (5511999998888). */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Verifica a assinatura X-Hub-Signature-256 do webhook (POST), exigida pela
 * Meta para provar que o payload veio de fato dela e não foi forjado. Calcula
 * o HMAC SHA256 do corpo BRUTO (raw body, antes de qualquer parse) usando o
 * WHATSAPP_APP_SECRET do app na Meta, e compara em tempo constante.
 */
export function verifyPayloadSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || !WHATSAPP_APP_SECRET) return false;

  const expected = `sha256=${createHmac("sha256", WHATSAPP_APP_SECRET).update(rawBody, "utf8").digest("hex")}`;
  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(signatureHeader, "utf8");

  // Buffers de tamanhos diferentes não podem ir para timingSafeEqual.
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}
