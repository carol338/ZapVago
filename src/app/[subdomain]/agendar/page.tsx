/**
 * Porta de entrada pública do agendamento — /{subdomain}/agendar[?service=].
 * Coleta nome + WhatsApp do visitante, gera o link pessoal na hora e
 * já entra direto no fluxo de agendamento (BookingFlow).
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { StartBookingForm } from "@/components/booking/StartBookingForm";

export async function generateMetadata({ params }: { params: { subdomain: string } }): Promise<Metadata> {
  const business = await prisma.business.findUnique({ where: { slug: params.subdomain } });
  return { title: business ? `Agendar na ${business.name}` : "Agendar — ZapVago" };
}

export default async function StartBookingPage({
  params,
  searchParams,
}: {
  params: { subdomain: string };
  searchParams: { service?: string; flashSale?: string };
}) {
  const business = await prisma.business.findUnique({ where: { slug: params.subdomain } });
  if (!business) notFound();

  let serviceName: string | null = null;
  if (searchParams.service) {
    const service = await prisma.service.findUnique({ where: { id: searchParams.service } });
    if (service && service.businessId === business.id) serviceName = service.name;
  }

  let flashSaleName: string | null = null;
  let flashSaleDiscount: number | null = null;
  if (searchParams.flashSale) {
    const flashSale = await prisma.flashSale.findFirst({
      where: { id: searchParams.flashSale, businessId: business.id, active: true, endDate: { gte: new Date() } },
    });
    if (flashSale) {
      flashSaleName = flashSale.name;
      flashSaleDiscount = flashSale.discountPercent;
    }
  }

  return (
    <StartBookingForm
      subdomain={params.subdomain}
      businessName={business.name}
      colorPrimary={business.colorPrimary}
      logo={business.logo}
      serviceId={searchParams.service}
      serviceName={serviceName}
      flashSaleId={flashSaleName ? searchParams.flashSale : undefined}
      flashSaleName={flashSaleName}
      flashSaleDiscount={flashSaleDiscount}
    />
  );
}
