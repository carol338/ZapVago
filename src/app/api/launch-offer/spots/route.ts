/** GET /api/launch-offer/spots — vagas restantes da oferta de lançamento (rota pública, usada na landing page). */
import { NextResponse } from "next/server";
import { getOrCreateLaunchOffer } from "@/lib/launch-offer";

// Sem isso, o Next.js otimiza essa rota como estática no build (não usa
// nenhuma API dinâmica) e serve a mesma resposta congelada pra sempre.
export const dynamic = "force-dynamic";

export async function GET() {
  const offer = await getOrCreateLaunchOffer();
  const remaining = Math.max(0, offer.totalSpots - offer.filledSpots);
  const active = offer.active && remaining > 0;

  return NextResponse.json({ total: offer.totalSpots, filled: offer.filledSpots, remaining, active });
}
