/**
 * Wrapper de pagamentos (Mercado Pago) — Pix e Cartão.
 * Em MOCK_MODE (ou sem MERCADOPAGO_ACCESS_TOKEN configurado), simula as
 * respostas, do mesmo jeito que claude.ts e whatsapp.ts fazem — dá pra
 * testar o fluxo inteiro de agendamento + pagamento sem conta real.
 *
 * Fora do mock, chama a API real do Mercado Pago (POST /v1/payments) sempre
 * com external_reference = appointmentId — é o que o webhook
 * (src/app/api/public/webhooks/mercadopago) usa pra descobrir a qual
 * agendamento um pagamento pertence, sem nunca confiar em nada que venha
 * direto do cliente.
 */
import { isMockMode } from "@/lib/mock";

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MP_API_BASE = "https://api.mercadopago.com";

function usingMock() {
  return isMockMode() || !MP_ACCESS_TOKEN;
}

function notificationUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL não configurado — não dá pra montar a notification_url do Mercado Pago.");
  }
  return `${appUrl}/api/public/webhooks/mercadopago`;
}

/**
 * A API do Mercado Pago exige um e-mail do pagador, mas o ZapVago não coleta
 * e-mail de cliente final (o fluxo é 100% WhatsApp) — usamos um e-mail
 * sintético derivado do telefone só pra identificar o pagador nos registros
 * do Mercado Pago, sem reusar o mesmo e-mail genérico pra todo mundo.
 */
function payerEmail(phone?: string): string {
  const digits = phone?.replace(/\D/g, "");
  return digits ? `cliente-${digits}@zapvago.app` : "cliente@zapvago.app";
}

function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

interface MercadoPagoErrorBody {
  message?: string;
  error?: string;
  cause?: { code: string | number; description: string }[];
}

/** POST /v1/payments na API do Mercado Pago, com log detalhado em caso de erro. */
async function postPayment(body: Record<string, unknown>, context: Record<string, unknown>): Promise<any> {
  let res: Response;
  try {
    res = await fetch(`${MP_API_BASE}/v1/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[payments.ts] Erro de rede ao chamar o Mercado Pago:", JSON.stringify({ context, error: String(err) }));
    throw new Error("Erro de rede ao se comunicar com o Mercado Pago.");
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const errorBody = json as MercadoPagoErrorBody | null;
    console.error(
      "[payments.ts] Mercado Pago recusou a requisição:",
      JSON.stringify({ status: res.status, context, request: body, response: errorBody }, null, 2)
    );
    throw new Error(`Mercado Pago recusou a requisição (${res.status}): ${errorBody?.message ?? errorBody?.error ?? "erro desconhecido"}`);
  }

  return json;
}

export interface PixCharge {
  paymentId: string;
  qrCode: string; // código "copia e cola"
  qrCodeBase64?: string; // imagem do QR Code em base64 (só disponível na integração real)
  expiresAt: string; // ISO
  mocked: boolean;
}

export async function createPixCharge(params: {
  amount: number;
  description: string;
  appointmentId: string;
  businessId: string;
  payerPhone?: string;
}): Promise<PixCharge> {
  if (usingMock()) {
    const paymentId = `mock_pix_${Date.now()}`;
    console.log(`[payments.ts MOCK] Pix criado: ${params.description} — R$ ${params.amount.toFixed(2)}`);
    return {
      paymentId,
      qrCode: `00020126PIXMOCK...${paymentId}...VALOR${params.amount.toFixed(2)}5303986304MOCK`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      mocked: true,
    };
  }

  console.log(
    `[payments.ts] Criando cobrança Pix: appointmentId=${params.appointmentId} businessId=${params.businessId} amount=${params.amount}`
  );

  const payment = await postPayment(
    {
      transaction_amount: roundCurrency(params.amount),
      description: params.description,
      payment_method_id: "pix",
      payer: { email: payerEmail(params.payerPhone) },
      external_reference: params.appointmentId,
      notification_url: notificationUrl(),
    },
    { appointmentId: params.appointmentId, businessId: params.businessId, kind: "pix" }
  );

  const qrCode = payment.point_of_interaction?.transaction_data?.qr_code;
  const qrCodeBase64 = payment.point_of_interaction?.transaction_data?.qr_code_base64;

  if (!qrCode) {
    console.error(
      `[payments.ts] Mercado Pago criou o pagamento ${payment.id} mas não retornou qr_code:`,
      JSON.stringify(payment)
    );
    throw new Error("Mercado Pago não retornou o código Pix.");
  }

  console.log(`[payments.ts] Pix criado com sucesso: paymentId=${payment.id} appointmentId=${params.appointmentId} status=${payment.status}`);

  return {
    paymentId: String(payment.id),
    qrCode,
    qrCodeBase64,
    // Mercado Pago define o próprio prazo de expiração do Pix; refletimos aqui
    // o que ele retornou. Se não vier, mantemos os 15min que o resto do app assume.
    expiresAt: payment.date_of_expiration ?? new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    mocked: false,
  };
}

export interface CardChargeResult {
  paymentId: string;
  status: "approved" | "rejected" | "pending";
  statusDetail?: string;
  mocked: boolean;
}

function mapCardStatus(mpStatus: string): "approved" | "rejected" | "pending" {
  switch (mpStatus) {
    case "approved":
      return "approved";
    case "pending":
    case "in_process":
    case "authorized":
      return "pending";
    default:
      return "rejected";
  }
}

export async function chargeCard(params: {
  amount: number;
  description: string;
  cardToken: string;
  installments: number;
  appointmentId: string;
  /** Bandeira detectada pelo SDK de tokenização do Mercado Pago no frontend (Card Form/Bricks). */
  paymentMethodId?: string;
  payerPhone?: string;
}): Promise<CardChargeResult> {
  if (usingMock()) {
    const paymentId = `mock_card_${Date.now()}`;
    console.log(`[payments.ts MOCK] Cartão cobrado em ${params.installments}x — R$ ${params.amount.toFixed(2)}`);
    return { paymentId, status: "approved", mocked: true };
  }

  if (!params.cardToken) {
    // O token é gerado no FRONT-END pelo SDK do Mercado Pago (Card Form/Bricks) —
    // número de cartão cru nunca deve chegar ao nosso backend (exigência de PCI
    // compliance do próprio Mercado Pago). Sem token, não tem como cobrar de verdade.
    console.error(
      `[payments.ts] chargeCard chamado sem cardToken para o agendamento ${params.appointmentId} — a tokenização do cartão no frontend ainda não está implementada.`
    );
    throw new Error("Token do cartão não informado — a tokenização do cartão no frontend ainda não está implementada.");
  }

  if (!params.paymentMethodId) {
    console.error(
      `[payments.ts] chargeCard sem paymentMethodId para o agendamento ${params.appointmentId} — usando "visa" como fallback, o que falha para outras bandeiras.`
    );
  }

  console.log(
    `[payments.ts] Cobrando cartão: appointmentId=${params.appointmentId} amount=${params.amount} installments=${params.installments}`
  );

  const payment = await postPayment(
    {
      transaction_amount: roundCurrency(params.amount),
      token: params.cardToken,
      description: params.description,
      installments: params.installments,
      payment_method_id: params.paymentMethodId ?? "visa",
      payer: { email: payerEmail(params.payerPhone) },
      external_reference: params.appointmentId,
      notification_url: notificationUrl(),
    },
    { appointmentId: params.appointmentId, kind: "card" }
  );

  const status = mapCardStatus(payment.status);
  if (status === "rejected") {
    console.error(
      `[payments.ts] Cartão recusado pelo Mercado Pago (payment ${payment.id}, appointmentId=${params.appointmentId}):`,
      JSON.stringify({ status: payment.status, statusDetail: payment.status_detail })
    );
  } else {
    console.log(
      `[payments.ts] Cartão ${status === "approved" ? "aprovado" : "pendente"}: paymentId=${payment.id} appointmentId=${params.appointmentId} status=${payment.status}`
    );
  }

  return {
    paymentId: String(payment.id),
    status,
    statusDetail: payment.status_detail,
    mocked: false,
  };
}
