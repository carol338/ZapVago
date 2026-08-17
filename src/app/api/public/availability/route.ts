/**
 * GET /api/public/availability?token=&serviceId=&professionalId=&date=
 * Horários livres para um dia, já considerando agenda real do negócio.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/availability";
import { parseLocalDate } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const serviceId = searchParams.get("serviceId");
  const professionalId = searchParams.get("professionalId") || undefined;
  const dateParam = searchParams.get("date");
  const flashSaleId = searchParams.get("flashSaleId") || undefined;

  if (!token || !serviceId || !dateParam) {
    return NextResponse.json({ error: "Parâmetros obrigatórios: token, serviceId, date." }, { status: 400 });
  }

  const bookingToken = await prisma.bookingToken.findUnique({ where: { token } });
  if (!bookingToken || bookingToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link de agendamento inválido ou expirado." }, { status: 404 });
  }

  const date = parseLocalDate(dateParam);

  let slots = await getAvailableSlots({
    businessId: bookingToken.businessId,
    date,
    serviceId,
    professionalId,
  });

  // Feirão (Bloco 3 Parte 2): quando o link veio de um feirão, só mostra
  // horários dentro da janela de dia/hora do feirão — fora dela não tem desconto.
  // A checagem de dia/hora é feita aqui no código (não só no range startDate/endDate
  // do banco), porque um feirão de "data única" tem startDate/endDate iguais a esse
  // único dia — em qualquer outra data a query do Prisma não encontraria o feirão e
  // o filtro seria pulado, deixando os horários sem filtrar por engano.
  if (flashSaleId) {
    const flashSale = await prisma.flashSale.findFirst({
      where: { id: flashSaleId, businessId: bookingToken.businessId, active: true },
    });
    if (flashSale && flashSale.serviceIds.includes(serviceId)) {
      const jsDay = date.getDay();
      const dayOfWeek = jsDay === 0 ? 7 : jsDay;
      const inRange = flashSale.startDate <= date && date <= flashSale.endDate;
      const inDayOfWeek = flashSale.daysOfWeek.includes(dayOfWeek);
      if (!inRange || !inDayOfWeek) {
        slots = [];
      } else {
        slots = slots.filter((s) => s.time >= flashSale.timeStart && s.time < flashSale.timeEnd);
      }
    }
  }

  return NextResponse.json({ slots });
}
