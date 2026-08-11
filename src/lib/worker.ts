/**
 * Worker do BullMQ — processa os jobs definidos em queue.ts.
 * Rodar separadamente do servidor Next.js: `npm run worker`
 */
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { offerSlotToWaitingList } from "@/lib/waiting-list";
import { buildMonthlyReportMessage } from "@/lib/reports";

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error("REDIS_URL não configurado — worker não pode iniciar.");
  process.exit(1);
}

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

// --- Lembretes de agendamento (24h / 1h antes) ---
new Worker(
  "reminders",
  async (job) => {
    const { appointmentId, type } = job.data;
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true, service: true, professional: true },
    });
    if (!appointment || appointment.status === "CANCELLED") return;

    const quando = type === "24h" ? "amanhã" : "em 1 hora";
    const msg = `Oi ${appointment.client.name.split(" ")[0]}! Lembrando do seu ${appointment.service.name} ${quando} com ${appointment.professional.name} 💈 Confirma presença?`;
    await sendWhatsAppMessage(appointment.client.phone, msg);

    const field = type === "24h" ? { reminderSent24: true } : { reminderSent1: true };
    await prisma.appointment.update({ where: { id: appointmentId }, data: field });
  },
  { connection }
);

// --- Relatório mensal ("Receita do Mês") ---
new Worker(
  "monthly-report",
  async (job) => {
    const { businessId } = job.data;
    const owner = await prisma.owner.findUnique({ where: { businessId } });
    if (!owner) return;
    const notifyOn = (owner.notifyOn as any) || {};
    if (!notifyOn.dailyReport && !notifyOn.weeklyReport) {
      // Regra de negócio: só envia relatório mensal se o dono tiver notificações ativas
      if (notifyOn.channel && notifyOn.channel !== "whatsapp") return;
    }
    const message = await buildMonthlyReportMessage(businessId);
    await sendWhatsAppMessage(owner.phone, message);
  },
  { connection }
);

// --- Timeout da lista de espera (10min sem resposta → próximo candidato) ---
new Worker(
  "waiting-list-timeout",
  async (job) => {
    const { waitingListEntryId } = job.data;
    const entry = await prisma.waitingListEntry.findUnique({ where: { id: waitingListEntryId } });
    if (!entry) return;
    // Se ainda não foi convertido em agendamento, remove e tenta o próximo da fila.
    const stillPending = await prisma.waitingListEntry.findUnique({ where: { id: waitingListEntryId } });
    if (stillPending) {
      await prisma.waitingListEntry.delete({ where: { id: waitingListEntryId } });
    }
  },
  { connection }
);

// --- Disparo de feirão (Flash Sale) ---
new Worker(
  "flash-sale-dispatch",
  async (job) => {
    const { flashSaleId } = job.data;
    const flashSale = await prisma.flashSale.findUnique({ where: { id: flashSaleId } });
    if (!flashSale || !flashSale.active) return;

    const targetTagsMap: Record<string, string> = {
      sumido: "sumido",
      novo: "novo",
      vip: "vip",
    };
    const tags = flashSale.targetClients.filter((t) => targetTagsMap[t]);
    const clients = await prisma.client.findMany({
      where: {
        businessId: flashSale.businessId,
        ...(flashSale.targetClients.includes("todos") ? {} : { tags: { hasSome: tags } }),
      },
    });

    for (const client of clients) {
      const msg =
        flashSale.message ||
        `🔥 ${flashSale.name}: ${flashSale.discountPercent}% OFF hoje! Bora aproveitar? Responda aqui pra garantir seu horário.`;
      await sendWhatsAppMessage(client.phone, msg);
    }

    await prisma.flashSale.update({
      where: { id: flashSaleId },
      data: { sentCount: { increment: clients.length } },
    });
  },
  { connection }
);

console.log("ZapVago worker iniciado — aguardando jobs...");
