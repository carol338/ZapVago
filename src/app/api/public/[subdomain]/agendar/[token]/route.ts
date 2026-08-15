/**
 * GET /api/public/[subdomain]/agendar/[token] — dados iniciais da página
 * de agendamento: negócio, cliente (se já identificado pelo link) e
 * serviço pré-selecionado (se veio do bot), além da lista completa de
 * serviços/profissionais pra troca manual.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { subdomain: string; token: string } }) {
  const bookingToken = await prisma.bookingToken.findUnique({
    where: { token: params.token },
    include: { business: true, client: true, service: true, professional: true },
  });

  if (!bookingToken || bookingToken.business.slug !== params.subdomain) {
    return NextResponse.json({ error: "Link de agendamento inválido." }, { status: 404 });
  }
  if (bookingToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Esse link de agendamento expirou." }, { status: 410 });
  }

  const [services, professionals] = await Promise.all([
    prisma.service.findMany({ where: { businessId: bookingToken.businessId, active: true }, orderBy: { order: "asc" } }),
    prisma.professional.findMany({ where: { businessId: bookingToken.businessId, active: true } }),
  ]);

  return NextResponse.json({
    business: {
      name: bookingToken.business.name,
      slug: bookingToken.business.slug,
      logo: bookingToken.business.logo,
      colorPrimary: bookingToken.business.colorPrimary,
      colorSecondary: bookingToken.business.colorSecondary,
      phone: bookingToken.business.phone,
    },
    client: bookingToken.client
      ? {
          id: bookingToken.client.id,
          name: bookingToken.client.name,
          phone: bookingToken.client.phone,
          preferredProfessionalId: (bookingToken.client.preferencias as any)?.professionalPreference ?? null,
        }
      : null,
    preselected: {
      serviceId: bookingToken.serviceId,
      professionalId: bookingToken.professionalId,
    },
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      duration: s.duration,
      price: s.price,
      image: s.image,
      description: s.description,
      color: s.color,
      comboOf: s.comboOf,
      comboDiscount: s.comboDiscount,
    })),
    professionals: professionals.map((p) => ({ id: p.id, name: p.name, photo: p.photo, color: p.color, serviceIds: p.serviceIds })),
  });
}
