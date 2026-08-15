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

  if (!token || !serviceId || !dateParam) {
    return NextResponse.json({ error: "Parâmetros obrigatórios: token, serviceId, date." }, { status: 400 });
  }

  const bookingToken = await prisma.bookingToken.findUnique({ where: { token } });
  if (!bookingToken || bookingToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link de agendamento inválido ou expirado." }, { status: 404 });
  }

  const slots = await getAvailableSlots({
    businessId: bookingToken.businessId,
    date: parseLocalDate(dateParam),
    serviceId,
    professionalId,
  });

  return NextResponse.json({ slots });
}
