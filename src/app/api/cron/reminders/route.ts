/**
 * GET/POST /api/cron/reminders — processa lembretes diretamente no banco,
 * sem fila (BullMQ não roda em ambiente serverless da Vercel — o worker em
 * src/lib/worker.ts continua existindo só para desenvolvimento local com
 * Redis). Registrado no vercel.json pra rodar a cada 15min; GET existe
 * porque é o método que o Vercel Cron (e a maioria dos crons externos)
 * usa por padrão.
 *
 * Idempotência (auditoria + correção):
 * - Antes desta versão, o lembrete era marcado como enviado (reminderSent24/1
 *   = true) incondicionalmente depois de chamar sendWhatsAppMessage — mas
 *   essa função NUNCA lança exceção, ela sempre retorna {success:false,...}
 *   em caso de falha. Resultado: uma falha real do WhatsApp (API fora do ar,
 *   token inválido) marcava o lembrete como "enviado" mesmo sem ter sido
 *   entregue — lembrete perdido pra sempre, sem re-tentativa.
 * - Se o processo caísse (timeout da função serverless, erro não tratado)
 *   entre o envio e o update de um item específico, esse item ficaria com
 *   o envio de fato feito mas o flag nunca atualizado — na próxima rodada
 *   ele seria reprocessado, causando envio duplicado.
 *
 * Correção: reminderStatus24/1 vira string ("pending" | "sent" | "failed" |
 * null) em vez de boolean. Cada item é marcado "pending" ANTES de enviar
 * (protege contra reprocessar um envio que já saiu, caso o processo caia
 * logo depois do sendWhatsAppMessage — a janela de duplicata fica restrita
 * a essa fração de segundo, não ao lote inteiro) e só vira "sent" depois de
 * confirmar result.success; se falhar, vira "failed" — a query abaixo busca
 * "not sent" (não "not attempted"), então "pending" e "failed" são
 * reprocessados na próxima rodada automaticamente, sem lógica extra.
 * Processado um por um (sequencial, nunca em lote/paralelo).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { addHours } from "date-fns";
import { requireCronSecret } from "@/lib/cron-auth";

async function processReminder(appointmentId: string, field: "reminderStatus24" | "reminderStatus1", message: string, phone: string, businessId: string): Promise<"sent" | "failed"> {
  await prisma.appointment.update({ where: { id: appointmentId }, data: { [field]: "pending" } });

  const result = await sendWhatsAppMessage(phone, message, businessId);
  const status = result.success ? "sent" : "failed";

  await prisma.appointment.update({ where: { id: appointmentId }, data: { [field]: status } });
  return status;
}

async function sendDueReminders(req: NextRequest): Promise<NextResponse> {
  const unauthorized = requireCronSecret(req);
  if (unauthorized) return unauthorized;

  const now = new Date();

  // OR: [{ x: null }, { x: { not: "sent" } }] em vez de só `{ not: "sent" }":
  // no SQL puro, "coluna <> 'sent'" nunca é verdadeiro pra linha com coluna
  // NULL (lógica de três valores) — um `not` direto excluiria silenciosamente
  // todo agendamento que nunca teve o lembrete tentado (o caso mais comum).
  const due24h = await prisma.appointment.findMany({
    where: {
      status: { in: ["CONFIRMED", "PENDING_CONFIRMATION"] },
      OR: [{ reminderStatus24: null }, { reminderStatus24: { not: "sent" } }],
      date: { lte: addHours(now, 24), gt: now },
    },
    include: { client: true, service: true, professional: true },
  });
  const due1h = await prisma.appointment.findMany({
    where: {
      status: { in: ["CONFIRMED", "PENDING_CONFIRMATION"] },
      OR: [{ reminderStatus1: null }, { reminderStatus1: { not: "sent" } }],
      date: { lte: addHours(now, 1), gt: now },
    },
    include: { client: true, service: true, professional: true },
  });

  let sent24h = 0;
  let failed24h = 0;
  for (const a of due24h) {
    const status = await processReminder(
      a.id,
      "reminderStatus24",
      `Oi ${a.client.name.split(" ")[0]}! Lembrando do seu ${a.service.name} amanhã com ${a.professional.name} 💈 Confirma presença?`,
      a.client.phone,
      a.businessId
    );
    if (status === "sent") sent24h += 1;
    else failed24h += 1;
  }

  let sent1h = 0;
  let failed1h = 0;
  for (const a of due1h) {
    const status = await processReminder(
      a.id,
      "reminderStatus1",
      `${a.client.name.split(" ")[0]}, seu horário é daqui a 1 hora com ${a.professional.name}! 🕐 Já tá vindo?`,
      a.client.phone,
      a.businessId
    );
    if (status === "sent") sent1h += 1;
    else failed1h += 1;
  }

  return NextResponse.json({
    success: true,
    processed: due24h.length + due1h.length,
    sent24h,
    failed24h,
    sent1h,
    failed1h,
  });
}

export async function GET(req: NextRequest) {
  return sendDueReminders(req);
}

export async function POST(req: NextRequest) {
  return sendDueReminders(req);
}
