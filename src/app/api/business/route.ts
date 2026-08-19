/**
 * GET  /api/business — dados do negócio do dono logado
 * PUT  /api/business — atualizar dados básicos do negócio
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function GET() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      // Nunca manda o hash de senha do dono pro frontend.
      owner: { select: { id: true, name: true, email: true, phone: true, notifyOn: true, lastMonthlyReportAt: true } },
      services: true,
      professionals: true,
    },
  });
  if (!business) return NextResponse.json(business);

  // whatsappProviderConfig guarda o accessToken real — nunca sai daqui, só o
  // status/phoneNumberId (ver GET /api/business/whatsapp-config pra isso).
  const { whatsappProviderConfig, ...safeBusiness } = business;
  return NextResponse.json(safeBusiness);
}

export async function PUT(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const body = await req.json();
  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      name: body.name,
      address: body.address,
      phone: body.phone,
      category: body.category,
    },
  });
  return NextResponse.json(updated);
}
