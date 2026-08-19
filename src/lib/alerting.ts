/**
 * Fallback/alerta quando uma integração externa (WhatsApp, Mercado Pago,
 * Claude) falha de verdade em produção. Sem isso, uma queda dessas APIs é
 * silenciosa: o dono acha que está tudo funcionando, mas mensagens não saem
 * e pagamentos não são processados.
 *
 * Cada falha real (nunca em MOCK_MODE — ver isMockMode()) é registrada em
 * IntegrationFailure, alimentando o painel "Status das Integrações" em
 * Configurações. Se o MESMO serviço falhar 3x na última hora, o dono é
 * avisado proativamente — sempre por push (é o único canal que não depende
 * de nenhuma das integrações que podem estar fora do ar), e também por
 * WhatsApp quando o serviço que falhou NÃO for o próprio WhatsApp.
 */
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { subHours } from "date-fns";

export type IntegrationService = "whatsapp" | "mercadopago" | "claude" | "cron";

const SERVICE_LABEL: Record<IntegrationService, string> = {
  whatsapp: "WhatsApp",
  mercadopago: "Mercado Pago",
  claude: "Claude AI",
  cron: "Job agendado",
};

const ESCALATION_THRESHOLD = 3; // falhas do mesmo serviço numa hora pra avisar o dono

export interface AlertFailureParams {
  service: IntegrationService;
  businessId: string;
  error: string;
  context?: Record<string, unknown>;
}

export async function alertFailure({ service, businessId, error, context }: AlertFailureParams): Promise<void> {
  console.error(
    JSON.stringify({ tag: "integration_failure", service, businessId, error, context, timestamp: new Date().toISOString() })
  );

  await prisma.integrationFailure.create({
    data: { businessId, service, error, context: (context ?? undefined) as Prisma.InputJsonValue | undefined },
  });

  // Só escala exatamente na 3ª falha da janela — evita reenviar o mesmo
  // aviso a cada nova falha depois que o dono já foi notificado uma vez.
  const since = subHours(new Date(), 1);
  const recentCount = await prisma.integrationFailure.count({
    where: { businessId, service, occurredAt: { gte: since } },
  });
  if (recentCount === ESCALATION_THRESHOLD) {
    await escalateToOwner(service, businessId, recentCount);
  }
}

async function escalateToOwner(service: IntegrationService, businessId: string, count: number): Promise<void> {
  const owner = await prisma.owner.findUnique({ where: { businessId } });
  if (!owner) return;

  const label = SERVICE_LABEL[service];
  const message = `⚠️ ${label} falhou ${count}x na última hora. Verifique suas credenciais em Configurações → Status das Integrações.`;

  // Import tardio pra evitar ciclo: notify.ts/whatsapp.ts podem, por sua vez,
  // chamar alertFailure quando o próprio envio de alerta falhar.
  const { sendPushToBusiness } = await import("@/lib/push");
  await sendPushToBusiness(businessId, { title: `⚠️ Falha em ${label}`, body: message, url: "/dashboard/settings" });

  if (service !== "whatsapp") {
    const { sendWhatsAppMessage } = await import("@/lib/whatsapp");
    await sendWhatsAppMessage(owner.phone, message, businessId);
  }
}
