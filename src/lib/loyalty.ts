/**
 * Fidelidade automática — Diferencial 10.
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
