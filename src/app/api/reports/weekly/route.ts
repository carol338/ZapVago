/** GET /api/reports/weekly?start=&end= — visão semanal para os gráficos do dashboard. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function GET(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const { searchParams } = new URL(req.url);
  const start = new Date(searchParams.get("start") ?? new Date());
  const end = new Date(searchParams.get("end") ?? new Date());

  const appointments = await prisma.appointment.findMany({
    where: { businessId, date: { gte: start, lte: end } },
    include: { service: true },
  });

  const porDia = new Map<string, { faturamento: number; agendados: number }>();
  appointments.forEach((a) => {
    const key = format(a.date, "EEE dd/MM", { locale: ptBR });
    const cur = porDia.get(key) ?? { faturamento: 0, agendados: 0 };
    cur.agendados += 1;
    if (a.status === "COMPLETED") cur.faturamento += a.service.price;
    porDia.set(key, cur);
  });

  return NextResponse.json({ series: [...porDia.entries()].map(([dia, v]) => ({ dia, ...v })) });
}
