/**
 * Página de agendamento com pagamento — /{subdomain}/agendar/{token}.
 * Server Component: valida o token e busca os dados iniciais; a parte
 * interativa (escolher serviço, horário, pagar) fica no BookingFlow.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BookingFlow } from "@/components/booking/BookingFlow";

async function getBookingData(subdomain: string, token: string, flashSaleId?: string) {
  const bookingToken = await prisma.bookingToken.findUnique({
    where: { token },
    include: { business: true, client: true },
  });
  if (!bookingToken || bookingToken.business.slug !== subdomain) return { notFoundReason: "invalid" as const };
  if (bookingToken.expiresAt < new Date()) return { notFoundReason: "expired" as const };
  if (!bookingToken.client) return { notFoundReason: "invalid" as const };

  const [services, professionals, flashSale] = await Promise.all([
    prisma.service.findMany({ where: { businessId: bookingToken.businessId, active: true }, orderBy: { order: "asc" } }),
    prisma.professional.findMany({ where: { businessId: bookingToken.businessId, active: true } }),
    flashSaleId
      ? prisma.flashSale.findFirst({
          where: { id: flashSaleId, businessId: bookingToken.businessId, active: true, endDate: { gte: new Date() } },
        })
      : null,
  ]);

  return {
    notFoundReason: null,
    business: {
      name: bookingToken.business.name,
      slug: bookingToken.business.slug,
      logo: bookingToken.business.logo,
      colorPrimary: bookingToken.business.colorPrimary,
      colorSecondary: bookingToken.business.colorSecondary,
      phone: bookingToken.business.phone,
    },
    client: {
      id: bookingToken.client.id,
      name: bookingToken.client.name,
      phone: bookingToken.client.phone,
      preferredProfessionalId: (bookingToken.client.preferencias as any)?.professionalPreference ?? null,
    },
    preselected: { serviceId: bookingToken.serviceId, professionalId: bookingToken.professionalId },
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
    flashSale: flashSale
      ? { id: flashSale.id, name: flashSale.name, discountPercent: flashSale.discountPercent, serviceIds: flashSale.serviceIds }
      : null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: { subdomain: string; token: string };
}): Promise<Metadata> {
  const data = await getBookingData(params.subdomain, params.token);
  if (data.notFoundReason) return { title: "Link de agendamento — ZapVago" };
  return { title: `Agendar na ${data.business!.name}` };
}

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: { subdomain: string; token: string };
  searchParams: { flashSale?: string };
}) {
  const data = await getBookingData(params.subdomain, params.token, searchParams.flashSale);

  if (data.notFoundReason === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0B] p-6 text-center text-[#FAFAFA]">
        <div>
          <p className="mb-2 text-2xl">⏰</p>
          <h1 className="mb-2 text-xl font-bold">Esse link expirou</h1>
          <p className="text-sm text-white/50">Peça pro negócio te mandar um novo link de agendamento.</p>
        </div>
      </div>
    );
  }
  if (data.notFoundReason) notFound();

  return (
    <BookingFlow
      token={params.token}
      business={data.business!}
      client={data.client!}
      preselected={data.preselected!}
      services={data.services!}
      professionals={data.professionals!}
      flashSale={data.flashSale}
    />
  );
}
