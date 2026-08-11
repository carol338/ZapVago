/** GET /api/reports/daily?date= — faturamento, agendados, risco de faltas, horários ociosos do dia. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { startOfDay, endOfDay } from "date-fns";
import { HIGH_RISK_THRESHOLD } from "@/lib/noshow";

export async function GET(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ? new Date(searchParams.get("date")!) : new Date();

  const appointments = await prisma.appointment.findMany({
    where: { businessId, date: { gte: startOfDay(date), lte: endOfDay(date) } },
    include: { service: true, client: true },
  });

  const faturamento = appointments.filter((a) => a.status === "COMPLETED").reduce((s, a) => s + a.service.price, 0);
  const faturamentoPrevisto = appointments
    .filter((a) => a.status === "CONFIRMED" || a.status === "PENDING_CONFIRMATION")
    .reduce((s, a) => s + a.service.price, 0);
  const altoRisco = appointments.filter((a) => a.noShowPredicted >= HIGH_RISK_THRESHOLD);

  return NextResponse.json({
    date,
    totalAgendados: appointments.length,
    faturamento,
    faturamentoPrevisto,
    altoRiscoCount: altoRisco.length,
    altoRisco: altoRisco.map((a) => ({ id: a.id, clientName: a.client.name, risk: a.noShowPredicted })),
  });
}
