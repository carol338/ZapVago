/**
 * POST /api/public/[subdomain]/start-booking — porta de entrada pública
 * do agendamento: visitante informa nome + WhatsApp na própria vitrine,
 * a gente acha ou cria o cliente e gera um BookingToken na hora, sem
 * precisar que o dono ou o bot gerem o link manualmente antes.
 */
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/whatsapp";

export async function POST(req: NextRequest, { params }: { params: { subdomain: string } }) {
  const business = await prisma.business.findUnique({ where: { slug: params.subdomain } });
  if (!business) {
    return NextResponse.json({ error: "Negócio não encontrado." }, { status: 404 });
  }

  const body = await req.json();
  const { name, phone, serviceId } = body as { name: string; phone: string; serviceId?: string };

  if (!name?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: "Nome e WhatsApp são obrigatórios." }, { status: 400 });
  }

  const cleanPhone = normalizePhone(phone);
  if (cleanPhone.length < 10) {
    return NextResponse.json({ error: "Número de WhatsApp inválido." }, { status: 400 });
  }

  if (serviceId) {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || service.businessId !== business.id) {
      return NextResponse.json({ error: "Serviço inválido." }, { status: 400 });
    }
  }

  const client = await prisma.client.upsert({
    where: { businessId_phone: { businessId: business.id, phone: cleanPhone } },
    update: { name: name.trim() },
    create: { businessId: business.id, name: name.trim(), phone: cleanPhone, tags: ["novo"] },
  });

  const token = randomBytes(9).toString("base64url");
  const bookingToken = await prisma.bookingToken.create({
    data: {
      token,
      businessId: business.id,
      clientId: client.id,
      serviceId: serviceId || undefined,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ token: bookingToken.token });
}
