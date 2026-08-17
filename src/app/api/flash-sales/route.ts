/** GET/POST /api/flash-sales — Diferencial 6 (Modo Feirão). */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function GET() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const flashSales = await prisma.flashSale.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } });

  // Métricas: taxa de conversão (agendados/enviados) e receita gerada pelos
  // agendamentos que vieram desse feirão (exclui cancelados/faltas).
  const withMetrics = await Promise.all(
    flashSales.map(async (f) => {
      const appointments = await prisma.appointment.findMany({
        where: { flashSaleId: f.id, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
        select: { price: true },
      });
      const revenue = appointments.reduce((sum, a) => sum + (a.price ?? 0), 0);
      const conversionRate = f.sentCount > 0 ? Math.round((f.bookedCount / f.sentCount) * 100) : 0;
      const link = `${appUrl}/${business?.slug}/agendar?flashSale=${f.id}`;
      return { ...f, revenue, conversionRate, link };
    })
  );

  return NextResponse.json(withMetrics);
}

export async function POST(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const body = await req.json();
  const flashSale = await prisma.flashSale.create({
    data: {
      businessId,
      name: body.name,
      discountPercent: body.discountPercent,
      serviceIds: body.serviceIds ?? [],
      professionalIds: body.professionalIds ?? [],
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      daysOfWeek: body.daysOfWeek ?? [],
      timeStart: body.timeStart,
      timeEnd: body.timeEnd,
      targetClients: body.targetClients ?? ["todos"],
      message: body.message,
    },
  });
  return NextResponse.json(flashSale, { status: 201 });
}
