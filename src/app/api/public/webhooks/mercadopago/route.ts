/**
 * POST /api/public/webhooks/mercadopago — callback de confirmação de pagamento.
 *
 * A notificação do Mercado Pago NUNCA é tratada como fonte de verdade — ela só
 * traz um ponteiro (payment_id). Todo o resto (status, valor, dono do pagamento)
 * é buscado de volta na API deles com nosso MERCADOPAGO_ACCESS_TOKEN antes de
 * mexer em qualquer agendamento. Isso fecha a brecha de alguém forjar um POST
 * pra esse endpoint marcando um agendamento como pago sem ter pagado nada.
 *
 * Contrato com a criação da cobrança (createPixCharge/chargeCard em payments.ts):
 * ao criar o pagamento no Mercado Pago, `external_reference` DEVE ser o id do
 * Appointment — é assim que esse webhook descobre a qual agendamento (e,
 * portanto, a qual negócio) um payment_id pertence.
 *
 * Em MOCK_MODE, mantém o atalho usado pelo botão "Já paguei" da página pública
 * de agendamento (sem conta real do Mercado Pago) — não há payment_id real do
 * Mercado Pago para verificar nesse caso.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmAppointmentPayment } from "@/lib/booking";
import { isMockMode } from "@/lib/mock";

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

interface MercadoPagoPayment {
  id: number;
  status: string; // "approved" | "pending" | "in_process" | "authorized" | "rejected" | "cancelled" | "refunded" | ...
  transaction_amount: number;
  external_reference: string | null;
}

export async function POST(req: NextRequest) {
  if (isMockMode()) {
    return handleMockConfirmation(req);
  }

  const paymentId = await extractPaymentId(req);
  if (!paymentId) {
    // Notificação de outro tipo (ex: merchant_order) ou sem id — nada a processar.
    console.log("[mercadopago webhook] Notificação recebida sem payment_id reconhecível — ignorada.");
    return NextResponse.json({ ok: true });
  }
  console.log(`[mercadopago webhook] Notificação recebida para payment_id ${paymentId}.`);

  if (!MERCADOPAGO_ACCESS_TOKEN) {
    console.error("[mercadopago webhook] MERCADOPAGO_ACCESS_TOKEN não configurado — impossível verificar o pagamento.");
    return NextResponse.json({ ok: true });
  }

  const payment = await fetchPayment(paymentId);
  if (!payment) {
    return NextResponse.json({ ok: true });
  }

  // external_reference é definido por NÓS na hora de criar a cobrança (id do
  // Appointment) — é o único jeito confiável de saber a qual agendamento (e
  // negócio) esse pagamento pertence, já que a notificação em si não carrega isso.
  // Sem ele (ou apontando pra um agendamento que não existe), rejeitamos e
  // logamos como possível incidente, nunca processamos.
  const appointmentId = payment.external_reference;
  if (!appointmentId) {
    console.error(`[mercadopago webhook] REJEITADO: pagamento ${payment.id} sem external_reference.`);
    return NextResponse.json({ ok: true });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { service: true },
  });
  if (!appointment) {
    console.error(`[mercadopago webhook] REJEITADO: external_reference "${appointmentId}" (pagamento ${payment.id}) não corresponde a nenhum agendamento.`);
    return NextResponse.json({ ok: true });
  }

  // Anti-replay: se o agendamento já está associado a OUTRO payment_id (ex: um Pix
  // expirou e um novo foi gerado depois), essa notificação é de uma cobrança velha.
  if (appointment.paymentId && appointment.paymentId !== String(payment.id)) {
    console.error(
      `[mercadopago webhook] REJEITADO: payment_id ${payment.id} não bate com o paymentId atual do agendamento ${appointmentId} (${appointment.paymentId}).`
    );
    return NextResponse.json({ ok: true });
  }

  const mapped = mapPaymentStatus(payment.status);
  if (!mapped) {
    console.log(`[mercadopago webhook] status "${payment.status}" do pagamento ${payment.id} não mapeado — nenhuma ação.`);
    return NextResponse.json({ ok: true });
  }

  // Idempotência: mesma notificação (ou reenvio) do mesmo payment_id já processada antes.
  if (appointment.paymentId === String(payment.id) && appointment.paymentStatus === mapped) {
    console.log(`[mercadopago webhook] DUPLICADO: pagamento ${payment.id} (agendamento ${appointmentId}) já estava como ${mapped} — nada a fazer.`);
    return NextResponse.json({ ok: true, status: mapped, alreadyProcessed: true });
  }

  if (mapped === "PAID") {
    // Anti-fraude: o valor confirmado pelo Mercado Pago precisa bater com o valor
    // real do agendamento — nunca confiamos em um valor vindo de fora pra isso.
    const expectedAmount = appointment.price ?? appointment.service.price;
    const amountMatches = Math.abs(payment.transaction_amount - expectedAmount) < 0.01;
    if (!amountMatches) {
      console.error(
        `[mercadopago webhook] FRAUDE/INCIDENTE: valor divergente no pagamento ${payment.id} do agendamento ${appointmentId} — esperado ${expectedAmount}, recebido ${payment.transaction_amount}. NÃO confirmado.`
      );
      return NextResponse.json({ ok: true, status: "amount_mismatch" });
    }
    console.log(`[mercadopago webhook] APROVADO: pagamento ${payment.id} confirmado para o agendamento ${appointmentId} (R$ ${payment.transaction_amount}).`);
    await confirmAppointmentPayment(appointmentId, String(payment.id));
  } else if (mapped === "FAILED") {
    // "rejected"/"cancelled" na API do Mercado Pago: o pagamento não vingou — o
    // agendamento em si vira CANCELLED (não faz sentido manter um horário
    // reservado sem pagamento associado), e paymentStatus registra que a
    // cobrança falhou (o schema não tem um valor "CANCELLED" próprio pra pagamento).
    console.log(`[mercadopago webhook] ${payment.status === "rejected" ? "REJEITADO" : "CANCELADO"}: pagamento ${payment.id} do agendamento ${appointmentId}.`);
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { paymentStatus: "FAILED", status: "CANCELLED", paymentId: String(payment.id) },
    });
  } else if (mapped === "REFUNDED") {
    // Estorno: só mexe no paymentStatus. Não mexemos em appointment.status aqui —
    // um reembolso pode acontecer bem depois do atendimento já ter sido prestado,
    // então cancelar automaticamente o agendamento seria uma suposição indevida.
    console.log(`[mercadopago webhook] ESTORNADO: pagamento ${payment.id} do agendamento ${appointmentId} foi reembolsado.`);
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { paymentStatus: "REFUNDED", paymentId: String(payment.id) },
    });
  } else {
    console.log(`[mercadopago webhook] PENDENTE: pagamento ${payment.id} do agendamento ${appointmentId} (status "${payment.status}").`);
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { paymentStatus: "PENDING", paymentId: String(payment.id) },
    });
  }

  return NextResponse.json({ ok: true, status: mapped });
}

/**
 * Extrai o payment_id da notificação. O Mercado Pago manda esse ponteiro em
 * formatos diferentes dependendo da integração:
 * - Webhooks v2: { type: "payment", data: { id } }
 * - Ou com "action" em vez de "type": { action: "payment.created"/"payment.updated", data: { id } }
 * - IPN clássico (query string): ?type=payment&data.id=... ou ?topic=payment&id=...
 */
async function extractPaymentId(req: NextRequest): Promise<string | null> {
  const body = await req.json().catch(() => null);
  const isPaymentEvent = body?.type === "payment" || (typeof body?.action === "string" && body.action.startsWith("payment."));
  if (isPaymentEvent && body?.data?.id) return String(body.data.id);

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") ?? searchParams.get("topic");
  const id = searchParams.get("data.id") ?? searchParams.get("id");
  if (type === "payment" && id) return id;

  return null;
}

/** Busca o pagamento real na API do Mercado Pago — nunca confiamos no que veio na notificação. */
async function fetchPayment(paymentId: string): Promise<MercadoPagoPayment | null> {
  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` },
    });
    if (!res.ok) {
      console.error(`[mercadopago webhook] Erro ${res.status} ao buscar pagamento ${paymentId} na API do Mercado Pago.`);
      return null;
    }
    return (await res.json()) as MercadoPagoPayment;
  } catch (err) {
    console.error("[mercadopago webhook] Erro de rede ao consultar pagamento:", err);
    return null;
  }
}

function mapPaymentStatus(mpStatus: string): "PAID" | "PENDING" | "FAILED" | "REFUNDED" | null {
  switch (mpStatus) {
    case "approved":
      return "PAID";
    case "pending":
    case "in_process":
    case "authorized":
      return "PENDING";
    case "rejected":
    case "cancelled":
      return "FAILED";
    case "refunded":
      return "REFUNDED";
    default:
      return null;
  }
}

/** MOCK_MODE: atalho usado pelo botão "Já paguei" da página pública (sem conta real do MP). */
async function handleMockConfirmation(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { appointmentId, paymentId } = body as { appointmentId?: string; paymentId?: string };

  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId é obrigatório." }, { status: 400 });
  }

  const appointment = await confirmAppointmentPayment(appointmentId, paymentId ?? `mock_confirm_${Date.now()}`);
  if (!appointment) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ status: appointment.status, paymentStatus: appointment.paymentStatus });
}
