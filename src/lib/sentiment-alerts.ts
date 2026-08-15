/**
 * Alerta de sentimentos — Bloco 2 Parte 4.4. Se mais de 20% das conversas
 * do dia forem negativas, avisa o dono. Dedup simples em memória (por
 * processo) pra não mandar o mesmo aviso várias vezes no mesmo dia —
 * suficiente pro modo mock; numa escala maior isso viraria uma coluna
 * no banco (ex: Business.lastNegativeAlertAt).
 */
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const alertedToday = new Map<string, string>(); // businessId -> "yyyy-mm-dd"

export async function checkDailyNegativeAlert(businessId: string) {
  const todayKey = startOfDay(new Date()).toISOString().slice(0, 10);
  if (alertedToday.get(businessId) === todayKey) return;

  const todayConversations = await prisma.conversation.findMany({
    where: { businessId, updatedAt: { gte: startOfDay(new Date()) } },
  });
  if (todayConversations.length < 3) return; // amostra pequena demais pra alertar

  const negativas = todayConversations.filter((c) => c.sentiment === "negative").length;
  const pct = negativas / todayConversations.length;
  if (pct <= 0.2) return;

  const business = await prisma.business.findUnique({ where: { id: businessId }, include: { owner: true } });
  if (!business?.owner) return;

  await sendWhatsAppMessage(
    business.owner.phone,
    `⚠️ Muitos clientes insatisfeitos hoje (${Math.round(pct * 100)}% das conversas). Verifique o painel.`
  );
  alertedToday.set(businessId, todayKey);
}
