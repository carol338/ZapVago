/** GET /api/reports/services?period= — serviços mais vendidos. */
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
    include: { service: true },
  });

  const porServico = new Map<string, { nome: string; quantidade: number; faturamento: number }>();
  appointments.forEach((a) => {
    const cur = porServico.get(a.serviceId) ?? { nome: a.service.name, quantidade: 0, faturamento: 0 };
    cur.quantidade += 1;
    cur.faturamento += a.service.price;
    porServico.set(a.serviceId, cur);
  });

  return NextResponse.json({ data: [...porServico.values()] });
}
