/**
 * Worker do BullMQ — processa os jobs definidos em queue.ts.
 * Rodar separadamente do servidor Next.js: `npm run worker`
 */
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { skipWaitingListOffer } from "@/lib/waiting-list";
import { buildMonthlyReportMessage } from "@/lib/reports";
import { notifyOwner } from "@/lib/notify";
import { resolveFlashSaleAudience } from "@/lib/flash-sale-audience";

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
    const message = await buildMonthlyReportMessage(businessId);
    await notifyOwner(businessId, "monthlyReport", message);
    await prisma.owner.update({ where: { id: owner.id }, data: { lastMonthlyReportAt: new Date() } });
  },
  { connection }
);

// --- Timeout da lista de espera (15min sem resposta → próximo candidato) ---
new Worker(
  "waiting-list-timeout",
  async (job) => {
    const { waitingListEntryId } = job.data;
    const entry = await prisma.waitingListEntry.findUnique({ where: { id: waitingListEntryId } });
    // Se ainda estiver com oferta pendente (cliente não confirmou nem foi removido),
    // passa a vaga pro próximo candidato — o cliente continua na fila.
    if (entry && entry.notified) {
      await skipWaitingListOffer(waitingListEntryId);
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

    const business = await prisma.business.findUnique({ where: { id: flashSale.businessId } });
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/${business?.slug}/agendar?flashSale=${flashSale.id}`;

    const clients = await resolveFlashSaleAudience(flashSale.businessId, flashSale.targetClients, flashSale.startDate, flashSale.endDate);

    for (const client of clients) {
      const msg =
        (flashSale.message || `🔥 ${flashSale.name}: ${flashSale.discountPercent}% OFF hoje! Bora aproveitar?`) +
        `\n\n👉 ${link}`;
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
