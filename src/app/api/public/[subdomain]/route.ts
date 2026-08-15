/**
 * GET /api/public/[subdomain] — dados públicos da vitrine do negócio.
 * Não exige autenticação (fica fora do matcher de src/middleware.ts).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { subdomain: string } }) {
  const business = await prisma.business.findUnique({
    where: { slug: params.subdomain },
    include: {
      services: { where: { active: true }, orderBy: { order: "asc" } },
      professionals: { where: { active: true } },
    },
  });

  if (!business) {
    return NextResponse.json({ error: "Negócio não encontrado" }, { status: 404 });
  }

  const settings = (business.settings as Record<string, any>) ?? {};

  return NextResponse.json({
    business: {
      name: business.name,
      slug: business.slug,
      logo: business.logo,
      coverImage: business.coverImage,
      colorPrimary: business.colorPrimary,
      colorSecondary: business.colorSecondary,
      address: business.address,
      phone: business.phone,
      workingHours: settings.workingHours ?? null,
    },
    services: business.services.map((s) => ({
      id: s.id,
      name: s.name,
      duration: s.duration,
      price: s.price,
      image: s.image,
      description: s.description,
      color: s.color,
    })),
    professionals: business.professionals.map((p) => ({
      id: p.id,
      name: p.name,
      photo: p.photo,
      color: p.color,
      serviceIds: p.serviceIds,
    })),
  });
}
