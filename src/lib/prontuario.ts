/**
 * Prontuário Inteligente — Bloco 2 Parte 2.
 * Calcula preferências e previsão de retorno a partir do histórico real
 * de agendamentos concluídos do cliente (não é um dado estático).
 */
import { differenceInDays, addDays } from "date-fns";
import { prisma } from "@/lib/prisma";

const DIA_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export interface Prontuario {
  serviceFavorito: { serviceId: string; name: string; count: number } | null;
  professionalPreferido: { professionalId: string; name: string; count: number } | null;
  diasPreferidos: string[];
  periodoPreferido: "manha" | "tarde" | "noite" | null;
  intervaloMedioDias: number | null;
  proximoRetorno: string | null;
  statusRetorno: "PONTUAL" | "ATRASADO" | "MUITO_ATRASADO" | null;
  diasAtrasado: number;
}

export async function computeProntuario(clientId: string): Promise<Prontuario> {
  const appointments = await prisma.appointment.findMany({
    where: { clientId, status: "COMPLETED" },
    include: { service: true, professional: true },
    orderBy: { date: "asc" },
  });

  const empty: Prontuario = {
    serviceFavorito: null,
    professionalPreferido: null,
    diasPreferidos: [],
    periodoPreferido: null,
    intervaloMedioDias: null,
    proximoRetorno: null,
    statusRetorno: null,
    diasAtrasado: 0,
  };
  if (appointments.length === 0) return empty;

  const serviceCounts = new Map<string, { name: string; count: number }>();
  const profCounts = new Map<string, { name: string; count: number }>();
  const dayCounts: Record<string, number> = {};
  let manha = 0,
    tarde = 0,
    noite = 0;

  for (const a of appointments) {
    const sc = serviceCounts.get(a.serviceId) ?? { name: a.service.name, count: 0 };
    sc.count++;
    serviceCounts.set(a.serviceId, sc);

    const pc = profCounts.get(a.professionalId) ?? { name: a.professional.name, count: 0 };
    pc.count++;
    profCounts.set(a.professionalId, pc);

    dayCounts[DIA_KEYS[a.date.getDay()]] = (dayCounts[DIA_KEYS[a.date.getDay()]] ?? 0) + 1;

    const hour = a.date.getHours();
    if (hour < 12) manha++;
    else if (hour < 18) tarde++;
    else noite++;
  }

  const topService = [...serviceCounts.entries()].sort((a, b) => b[1].count - a[1].count)[0];
  const topProf = [...profCounts.entries()].sort((a, b) => b[1].count - a[1].count)[0];
  const diasPreferidos = Object.entries(dayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => k);
  const periodos: Array<["manha" | "tarde" | "noite", number]> = [
    ["manha", manha],
    ["tarde", tarde],
    ["noite", noite],
  ];
  const periodoPreferido = periodos.sort((a, b) => b[1] - a[1])[0][0];

  let intervaloMedioDias: number | null = null;
  if (appointments.length >= 2) {
    const primeira = appointments[0].date;
    const ultima = appointments[appointments.length - 1].date;
    intervaloMedioDias = differenceInDays(ultima, primeira) / (appointments.length - 1);
  }

  let proximoRetorno: Date | null = null;
  let statusRetorno: Prontuario["statusRetorno"] = null;
  let diasAtrasado = 0;

  if (intervaloMedioDias && intervaloMedioDias > 0) {
    const ultima = appointments[appointments.length - 1].date;
    proximoRetorno = addDays(ultima, Math.round(intervaloMedioDias));
    const diffFromExpected = differenceInDays(new Date(), proximoRetorno);
    if (diffFromExpected > 14) {
      statusRetorno = "MUITO_ATRASADO";
      diasAtrasado = diffFromExpected;
    } else if (diffFromExpected > 0) {
      statusRetorno = "ATRASADO";
      diasAtrasado = diffFromExpected;
    } else {
      statusRetorno = "PONTUAL";
    }
  }

  return {
    serviceFavorito: topService ? { serviceId: topService[0], name: topService[1].name, count: topService[1].count } : null,
    professionalPreferido: topProf ? { professionalId: topProf[0], name: topProf[1].name, count: topProf[1].count } : null,
    diasPreferidos,
    periodoPreferido,
    intervaloMedioDias: intervaloMedioDias ? Math.round(intervaloMedioDias) : null,
    proximoRetorno: proximoRetorno ? proximoRetorno.toISOString() : null,
    statusRetorno,
    diasAtrasado,
  };
}
