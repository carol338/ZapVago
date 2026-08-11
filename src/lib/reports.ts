/**
 * Geração do relatório "Receita do Mês" (Diferencial 7) e cálculos
 * auxiliares usados nas telas de Relatórios.
 */
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function buildMonthlyReportMessage(businessId: string): Promise<string> {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return "";

  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  const prevStart = startOfMonth(subMonths(now, 1));
  const prevEnd = endOfMonth(subMonths(now, 1));

  const [appointments, prevAppointments, clients] = await Promise.all([
    prisma.appointment.findMany({ where: { businessId, date: { gte: start, lte: end } }, include: { service: true, professional: true, client: true } }),
    prisma.appointment.findMany({ where: { businessId, date: { gte: prevStart, lte: prevEnd } }, include: { service: true } }),
    prisma.client.findMany({ where: { businessId } }),
  ]);

  const completed = appointments.filter((a) => a.status === "COMPLETED");
  const noShows = appointments.filter((a) => a.status === "NO_SHOW");
  const cancelled = appointments.filter((a) => a.status === "CANCELLED");

  const faturamento = completed.reduce((sum, a) => sum + a.service.price, 0);
  const faturamentoAnterior = prevAppointments
    .filter((a) => a.status === "COMPLETED")
    .reduce((sum, a) => sum + a.service.price, 0);
  const variacao = faturamentoAnterior > 0 ? Math.round(((faturamento - faturamentoAnterior) / faturamentoAnterior) * 100) : 0;

  const taxaComparecimento = appointments.length > 0 ? Math.round((completed.length / appointments.length) * 100) : 0;
  const taxaFaltas = appointments.length > 0 ? Math.round((noShows.length / appointments.length) * 100) : 0;

  // Profissional do mês
  const porProfissional = new Map<string, number>();
  completed.forEach((a) => porProfissional.set(a.professional.name, (porProfissional.get(a.professional.name) || 0) + 1));
  const profDoMes = [...porProfissional.entries()].sort((a, b) => b[1] - a[1])[0];
  const profPct = profDoMes ? Math.round((profDoMes[1] / completed.length) * 100) : 0;

  // Cliente do mês
  const porCliente = new Map<string, { visitas: number; gasto: number }>();
  completed.forEach((a) => {
    const cur = porCliente.get(a.client.name) || { visitas: 0, gasto: 0 };
    cur.visitas += 1;
    cur.gasto += a.service.price;
    porCliente.set(a.client.name, cur);
  });
  const clienteDoMes = [...porCliente.entries()].sort((a, b) => b[1].gasto - a[1].gasto)[0];

  const sumidos = clients.filter((c) => c.lastVisitAt && differenceInDays(now, c.lastVisitAt) >= 60).length;

  const mesAno = format(now, "MMMM/yyyy", { locale: ptBR });

  return `📊 ZAPVAGO - RECEITA DO MÊS
${business.name} - ${mesAno}

💰 Faturamento: R$ ${faturamento.toFixed(2)} (${variacao >= 0 ? "+" : ""}${variacao}% vs mês anterior)
📅 Agendamentos: ${appointments.length}
✅ Comparecimentos: ${completed.length} (${taxaComparecimento}%)
❌ Faltas: ${noShows.length} (${taxaFaltas}%)
🔄 Remarcações: ${cancelled.length}

🏆 Profissional do mês: ${profDoMes ? `${profDoMes[0]} (${profPct}% dos agendamentos)` : "sem dados ainda"}
⭐ Cliente do mês: ${clienteDoMes ? `${clienteDoMes[0]} (${clienteDoMes[1].visitas} visitas, R$${clienteDoMes[1].gasto.toFixed(2)} gasto)` : "sem dados ainda"}

⚠️ Alertas:
• ${sumidos} clientes sumidos há 60+ dias

💡 Sugestões:
• Criar Feirão para preencher horários ociosos
• Mandar mensagem para os clientes sumidos

[RESPONDA "sim" para eu mandar mensagem para os sumidos]`;
}
