/**
 * Filas do BullMQ — jobs agendados do ZapVago:
 * - reminders: lembretes 24h/1h antes do agendamento
 * - monthly-report: "Receita do Mês" enviado dia 1 às 08h
 * - waiting-list-timeout: expira oferta de vaga não respondida em 10min
 * - flash-sale-dispatch: envia mensagens de feirão para clientes-alvo
 *
 * Requer Redis (REDIS_URL). Em MOCK_MODE sem Redis configurado, as filas
 * não são inicializadas — use src/app/api/cron/* para simular manualmente.
 */
import { Queue } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL;

const connection = REDIS_URL ? new IORedis(REDIS_URL, { maxRetriesPerRequest: null }) : null;

export const remindersQueue = connection ? new Queue("reminders", { connection }) : null;
export const monthlyReportQueue = connection ? new Queue("monthly-report", { connection }) : null;
export const waitingListQueue = connection ? new Queue("waiting-list-timeout", { connection }) : null;
export const flashSaleQueue = connection ? new Queue("flash-sale-dispatch", { connection }) : null;

/** Agenda os lembretes de 24h e 1h para um novo agendamento. */
export async function scheduleReminders(appointmentId: string, appointmentDate: Date) {
  if (!remindersQueue) {
    console.log(`[queue.ts MOCK] Lembretes agendados para appointment ${appointmentId}`);
    return;
  }
  const in24h = appointmentDate.getTime() - Date.now() - 24 * 60 * 60 * 1000;
  const in1h = appointmentDate.getTime() - Date.now() - 60 * 60 * 1000;

  if (in24h > 0) {
    await remindersQueue.add("reminder-24h", { appointmentId, type: "24h" }, { delay: in24h });
  }
  if (in1h > 0) {
    await remindersQueue.add("reminder-1h", { appointmentId, type: "1h" }, { delay: in1h });
  }
}

/** Agenda o relatório mensal para o dia 1 do próximo mês às 08h. */
export async function scheduleMonthlyReport(businessId: string) {
  if (!monthlyReportQueue) return;
  await monthlyReportQueue.add(
    "monthly-report",
    { businessId },
    { repeat: { pattern: "0 8 1 * *" } } // cron: min hora dia mês diaSemana
  );
}

/** Agenda o timeout de 10 minutos para uma oferta de lista de espera. */
export async function scheduleWaitingListTimeout(waitingListEntryId: string) {
  if (!waitingListQueue) return;
  await waitingListQueue.add("timeout", { waitingListEntryId }, { delay: 10 * 60 * 1000 });
}
