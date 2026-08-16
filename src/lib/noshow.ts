/**
 * Previsão de faltas (no-show) — Diferencial 5 / Bloco 2 Parte 3.
 * Algoritmo explicável baseado em histórico do cliente e sinais do
 * agendamento específico. Recalculado sempre que o cliente confirma,
 * cancela, falta, conclui um atendimento, ou cria um novo agendamento.
 */
import { differenceInDays } from "date-fns";
import { Client } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyOwner } from "@/lib/notify";

interface NoShowInput {
  client: Pick<Client, "noShowCount" | "totalVisits" | "cancelLateCount" | "lastVisitAt">;
  clientConfirmed: boolean;
}

/**
 * risco = histórico de faltas (40%) + cancelamentos em cima da hora (20%)
 *       + não confirmou lembrete (30%) + cliente frio, 30+ dias sem visita (10%)
 * Retorna um número de 0 a 1.
 */
export function calculateNoShowRisk({ client, clientConfirmed }: NoShowInput): number {
  const visits = Math.max(client.totalVisits, 1);
  let risco = 0;

  risco += (client.noShowCount / visits) * 0.4;
  risco += (client.cancelLateCount / visits) * 0.2;
  risco += clientConfirmed ? 0 : 0.3;

  const diasDesdeUltimaVisita = client.lastVisitAt ? differenceInDays(new Date(), client.lastVisitAt) : 999;
  if (diasDesdeUltimaVisita > 30) risco += 0.1;

  return Math.min(1, Math.round(risco * 100) / 100);
}

export const HIGH_RISK_THRESHOLD = 0.5;
export const CRITICAL_RISK_THRESHOLD = 0.7;

/**
 * Recalcula o risco de todos os agendamentos futuros (ainda não concluídos/
 * cancelados) de um cliente — chamado sempre que as estatísticas do cliente
 * mudam. Notifica o dono via WhatsApp se algum agendamento cruzar 70% de
 * risco pela primeira vez.
 */
export async function recalculateClientFutureRisk(clientId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return;

  const futureAppointments = await prisma.appointment.findMany({
    where: {
      clientId,
      date: { gte: new Date() },
      status: { in: ["CONFIRMED", "PENDING_CONFIRMATION"] },
    },
    include: { client: true, service: true, business: { include: { owner: true } } },
  });

  for (const appt of futureAppointments) {
    const risco = calculateNoShowRisk({ client, clientConfirmed: appt.clientConfirmed });

    await prisma.appointment.update({ where: { id: appt.id }, data: { noShowPredicted: risco } });

    if (risco >= CRITICAL_RISK_THRESHOLD && !appt.riskNotifiedAt && appt.business.owner) {
      const dataFormatada = appt.date.toLocaleString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      const msg = `⚠️ ALERTA DE FALTA PROVÁVEL

${appt.client.name} tem ${Math.round(risco * 100)}% de chance de faltar (${dataFormatada}).

Não confirmou o lembrete e já faltou ${appt.client.noShowCount}x no passado.

Acesse o painel pra mandar uma confirmação extra.`;

      await notifyOwner(appt.businessId, "noShowRisk", msg, `/dashboard`);
      await prisma.appointment.update({ where: { id: appt.id }, data: { riskNotifiedAt: new Date() } });
    }
  }
}
