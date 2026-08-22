/**
 * POST /api/onboarding/demo-data/dismiss — marca o banner de dados de teste
 * como dispensado ("Entendi"), sem apagar os dados demo em si.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function POST() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { settings: true } });
  const settings = (business?.settings as any) ?? {};

  await prisma.business.update({
    where: { id: businessId },
    data: { settings: { ...settings, demoBannerDismissed: true } },
  });

  return NextResponse.json({ ok: true });
}
