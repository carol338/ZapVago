/**
 * Público-alvo do Feirão (Bloco 3 Parte 2.3) — critérios calculados a partir
 * do histórico real do cliente, não de tags estáticas:
 * - sumido: última visita há mais de 30 dias
 * - novo: no máximo 1 visita
 * - vip: gasto total no top 20% dos clientes do negócio
 * - todos: todo mundo
 * Também exclui quem já tem um agendamento marcado dentro do período do
 * feirão (regra de negócio: não oferecer desconto pra quem já vai aparecer).
 */
import { prisma } from "@/lib/prisma";
import { differenceInDays } from "date-fns";

const SUMIDO_DAYS = 30;

export async function resolveFlashSaleAudience(businessId: string, targetClients: string[], flashSaleStart: Date, flashSaleEnd: Date) {
  const allClients = await prisma.client.findMany({
    where: { businessId, OR: [{ silencedUntil: null }, { silencedUntil: { lt: new Date() } }] },
  });

  const wantsTodos = targetClients.includes("todos");

  let audience = allClients;
  if (!wantsTodos) {
    const sortedBySpend = [...allClients].sort((a, b) => b.totalSpent - a.totalSpent);
    const vipCutoffIndex = Math.max(0, Math.ceil(sortedBySpend.length * 0.2) - 1);
    const vipThreshold = sortedBySpend[vipCutoffIndex]?.totalSpent ?? Infinity;

    audience = allClients.filter((c) => {
      if (targetClients.includes("sumido") && c.lastVisitAt && differenceInDays(new Date(), c.lastVisitAt) > SUMIDO_DAYS) return true;
      if (targetClients.includes("novo") && c.totalVisits <= 1) return true;
      if (targetClients.includes("vip") && c.totalSpent > 0 && c.totalSpent >= vipThreshold) return true;
      return false;
    });
  }

  // Não manda pra quem já tem agendamento marcado dentro do período do feirão.
  const alreadyBooked = await prisma.appointment.findMany({
    where: {
      businessId,
      date: { gte: flashSaleStart, lte: flashSaleEnd },
      status: { in: ["CONFIRMED", "PENDING_CONFIRMATION"] },
    },
    select: { clientId: true },
  });
  const bookedIds = new Set(alreadyBooked.map((a) => a.clientId));

  return audience.filter((c) => !bookedIds.has(c.id));
}
