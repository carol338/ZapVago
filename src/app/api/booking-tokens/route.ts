/**
 * POST /api/booking-tokens — gera um link de agendamento (com pagamento)
 * para um cliente específico. Usado pelo dono (botão "Gerar link") e, no
 * futuro, pelo bot do WhatsApp quando o cliente pede pra agendar.
 * Válido por 24h.
 */
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const body = await req.json();
  const { clientId, serviceId, professionalId } = body as {
    clientId: string;
    serviceId?: string;
    professionalId?: string;
  };

  if (!clientId) {
    return NextResponse.json({ error: "clientId é obrigatório." }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client || client.businessId !== businessId) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  const token = randomBytes(9).toString("base64url");

  const bookingToken = await prisma.bookingToken.create({
    data: {
      token,
      businessId,
      clientId,
      serviceId: serviceId || undefined,
      professionalId: professionalId || undefined,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${appUrl}/${business!.slug}/agendar/${bookingToken.token}`;

  return NextResponse.json({ token: bookingToken.token, url, expiresAt: bookingToken.expiresAt });
}
