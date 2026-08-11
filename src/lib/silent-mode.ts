/**
 * Modo Silencioso — Diferencial 9.
 * Verifica regras configuráveis pelo dono contra o histórico do cliente
 * e aplica a ação correspondente (exigir pagamento antecipado, silenciar
 * ofertas, exigir confirmação extra).
 */
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

export async function applySilentRules(businessId: string, clientId: string) {
  const [rules, client] = await Promise.all([
    prisma.silentRule.findMany({ where: { businessId, active: true } }),
    prisma.client.findUnique({ where: { id: clientId } }),
  ]);
  if (!client) return;

  for (const rule of rules) {
    if (rule.trigger === "noshow_3x" && client.noShowCount >= 3 && !client.requiresPrepayment) {
      await prisma.client.update({ where: { id: clientId }, data: { requiresPrepayment: true } });
    }
    if (rule.trigger === "late_cancel_2x") {
      // Contabilizado externamente ao cancelar em cima da hora; aqui apenas
      // documentamos a regra — a contagem fica em Client.tags "cancelador".
    }
  }
}

export async function silenceClientOffers(clientId: string, days = 30) {
  await prisma.client.update({
    where: { id: clientId },
    data: { silencedUntil: addDays(new Date(), days) },
  });
}
