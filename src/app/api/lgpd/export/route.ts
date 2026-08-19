/**
 * POST /api/lgpd/export — LGPD Art. 18, II/V (portabilidade e acesso aos
 * dados). Devolve um JSON com todos os dados pessoais que o ZapVago guarda
 * pra esse negócio: dono, negócio, clientes finais, agendamentos e
 * conversas — mais os dados auxiliares (serviços, profissionais, fidelidade,
 * feirões, lista de espera) que também compõem o "todos os dados do
 * negócio" pedido, já que muitos referenciam dados pessoais de clientes.
 *
 * Nunca inclui o hash de senha do dono nem o accessToken do WhatsApp — esses
 * são segredos de autenticação, não dados pessoais do titular.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function POST() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const [owner, business, services, professionals, clients, appointments, conversations, loyaltyRules, flashSales, waitingList, waitingListEvents] =
    await Promise.all([
      prisma.owner.findUnique({
        where: { businessId },
        select: { id: true, name: true, email: true, phone: true, notifyOn: true, consentTermsAt: true, consentMarketing: true, dataProcessingAckAt: true, createdAt: true },
      }),
      prisma.business.findUnique({ where: { id: businessId } }),
      prisma.service.findMany({ where: { businessId } }),
      prisma.professional.findMany({ where: { businessId } }),
      prisma.client.findMany({ where: { businessId }, include: { clientNotes: true } }),
      prisma.appointment.findMany({ where: { businessId } }),
      prisma.conversation.findMany({ where: { businessId } }),
      prisma.loyaltyRule.findMany({ where: { businessId } }),
      prisma.flashSale.findMany({ where: { businessId } }),
      prisma.waitingListEntry.findMany({ where: { businessId } }),
      prisma.waitingListEvent.findMany({ where: { businessId } }),
    ]);

  const { whatsappProviderConfig, ...safeBusiness } = business ?? {};

  const exportData = {
    exportedAt: new Date().toISOString(),
    owner,
    business: safeBusiness,
    services,
    professionals,
    clients,
    appointments,
    conversations,
    loyaltyRules,
    flashSales,
    waitingList,
    waitingListEvents,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="zapvago-dados-${businessId}.json"`,
    },
  });
}
