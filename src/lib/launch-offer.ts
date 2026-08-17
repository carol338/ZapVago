/** Contador de vagas da oferta de lançamento (14 dias grátis), exibido na landing page. */
import { prisma } from "@/lib/prisma";

/** Garante que exista uma linha de controle, criando com o baseline já anunciado publicamente. */
export async function getOrCreateLaunchOffer() {
  const existing = await prisma.launchOffer.findFirst();
  if (existing) return existing;
  return prisma.launchOffer.create({ data: { totalSpots: 50, filledSpots: 32, active: true } });
}

/** Chamado a cada novo cadastro (POST /api/auth/register) — incrementa e desativa a oferta quando esgota. */
export async function fillLaunchOfferSpot() {
  const offer = await getOrCreateLaunchOffer();
  if (!offer.active || offer.filledSpots >= offer.totalSpots) return;

  const filledSpots = offer.filledSpots + 1;
  await prisma.launchOffer.update({
    where: { id: offer.id },
    data: { filledSpots, active: filledSpots < offer.totalSpots },
  });
}
