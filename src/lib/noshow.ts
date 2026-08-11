/**
 * Previsão de faltas (no-show) — Diferencial 5.
 * Algoritmo simples e explicável baseado em histórico do cliente
 * e sinais do agendamento específico.
 */
import { differenceInDays } from "date-fns";
import { Client } from "@prisma/client";

interface NoShowInput {
  client: Pick<Client, "noShowCount" | "totalVisits" | "lastContactedAt">;
  clientConfirmed: boolean;
  appointmentDate: Date;
  createdAt: Date;
}

/** Retorna um risco de 0 a 1. Acima de 0.5 é considerado alto risco (⚠️ na planilha). */
export function calculateNoShowRisk({ client, clientConfirmed, appointmentDate, createdAt }: NoShowInput): number {
  let risco = 0;

  // Histórico de faltas do cliente
  if (client.totalVisits > 0) {
    risco += (client.noShowCount / client.totalVisits) * 0.4;
  }

  // Cliente "frio" — sem contato recente
  const diasDesdeUltimoContato = client.lastContactedAt ? differenceInDays(new Date(), client.lastContactedAt) : 999;
  if (diasDesdeUltimoContato > 30) risco += 0.2;

  // Não confirmou o lembrete
  if (!clientConfirmed) risco += 0.3;

  // Agendou com muita antecedência
  const diasDesdeAgendamento = differenceInDays(appointmentDate, createdAt);
  if (diasDesdeAgendamento > 14) risco += 0.1;

  return Math.min(1, Math.round(risco * 100) / 100);
}

export const HIGH_RISK_THRESHOLD = 0.5;
