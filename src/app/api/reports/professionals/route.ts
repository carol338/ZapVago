/** GET /api/reports/professionals?period= — desempenho por profissional. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const { searchParams } = new URL(req.url);
  const period = Number(searchParams.get("period") ?? 30);

  const appointments = await prisma.appointment.findMany({
    where: { businessId, date: { gte: subDays(new Date(), period) }, status: "COMPLETED" },
    include: { professional: true, service: true },
  });

  const porProfissional = new Map<string, { nome: string; atendimentos: number; faturamento: number }>();
  appointments.forEach((a) => {
    const cur = porProfissional.get(a.professionalId) ?? { nome: a.professional.name, atendimentos: 0, faturamento: 0 };
    cur.atendimentos += 1;
    cur.faturamento += a.service.price;
    porProfissional.set(a.professionalId, cur);
  });

  return NextResponse.json({ data: [...porProfissional.values()] });
}
