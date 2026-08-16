/**
 * Fidelidade automática — Bloco 3 Parte 3.
 * Verifica se o cliente atingiu o número de visitas necessário para
 * uma recompensa e retorna a regra aplicável, se houver.
 */
import { prisma } from "@/lib/prisma";

export async function checkLoyaltyReward(businessId: string, clientLoyaltyPoints: number) {
  const rules = await prisma.loyaltyRule.findMany({
    where: { businessId, active: true },
    orderBy: { visitsRequired: "asc" },
  });

  const eligible = rules.find((r) => clientLoyaltyPoints >= r.visitsRequired);
  return eligible ?? null;
}

/** Quantas visitas faltam para a próxima recompensa (para exibir no prompt do Claude). */
export async function visitsUntilNextReward(businessId: string, clientLoyaltyPoints: number): Promise<number | null> {
  const rules = await prisma.loyaltyRule.findMany({
    where: { businessId, active: true },
    orderBy: { visitsRequired: "asc" },
  });
  const next = rules.find((r) => r.visitsRequired > clientLoyaltyPoints);
  return next ? next.visitsRequired - clientLoyaltyPoints : null;
}

/**
 * Uso do prêmio (Parte 3.4): se o cliente está agendando exatamente o
 * serviço-prêmio de uma regra ativa e já tem pontos suficientes, aplica o
 * desconto automaticamente e desconta os pontos usados (não zera — subtrai
 * só o necessário, sobras contam pra próxima recompensa).
 */
export async function tryRedeemLoyaltyReward(
  businessId: string,
  client: { id: string; loyaltyPoints: number },
  serviceId: string
): Promise<{ discountPercent: number; ruleId: string } | null> {
  const rule = await prisma.loyaltyRule.findFirst({
    where: { businessId, active: true, rewardServiceId: serviceId, visitsRequired: { lte: client.loyaltyPoints } },
    orderBy: { visitsRequired: "desc" },
  });
  if (!rule) return null;

  await prisma.client.update({
    where: { id: client.id },
    data: { loyaltyPoints: { decrement: rule.visitsRequired } },
  });

  return { discountPercent: rule.rewardDiscount, ruleId: rule.id };
}
