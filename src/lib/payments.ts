/**
 * Wrapper de pagamentos (Mercado Pago) — Pix e Cartão.
 * Em MOCK_MODE (ou sem MERCADOPAGO_ACCESS_TOKEN configurado), simula as
 * respostas, do mesmo jeito que claude.ts e whatsapp.ts fazem — dá pra
 * testar o fluxo inteiro de agendamento + pagamento sem conta real.
 */
import { isMockMode } from "@/lib/mock";

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

function usingMock() {
  return isMockMode() || !MP_ACCESS_TOKEN;
}

export interface PixCharge {
  paymentId: string;
  qrCodeText: string; // código "copia e cola"
  expiresAt: string; // ISO
  mocked: boolean;
}

export async function createPixCharge(params: { amount: number; description: string }): Promise<PixCharge> {
  if (usingMock()) {
    const paymentId = `mock_pix_${Date.now()}`;
    console.log(`[payments.ts MOCK] Pix criado: ${params.description} — R$ ${params.amount.toFixed(2)}`);
    return {
      paymentId,
      qrCodeText: `00020126PIXMOCK...${paymentId}...VALOR${params.amount.toFixed(2)}5303986304MOCK`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      mocked: true,
    };
  }

  // Integração real com a API do Mercado Pago entra aqui quando houver
  // MERCADOPAGO_ACCESS_TOKEN configurado (criação de pagamento Pix via /v1/payments).
  throw new Error("Integração real do Mercado Pago ainda não configurada");
}

export interface CardChargeResult {
  paymentId: string;
  status: "approved" | "rejected";
  mocked: boolean;
}

export async function chargeCard(params: { amount: number; installments: number }): Promise<CardChargeResult> {
  if (usingMock()) {
    const paymentId = `mock_card_${Date.now()}`;
    console.log(`[payments.ts MOCK] Cartão cobrado em ${params.installments}x — R$ ${params.amount.toFixed(2)}`);
    return { paymentId, status: "approved", mocked: true };
  }

  throw new Error("Integração real do Mercado Pago ainda não configurada");
}
