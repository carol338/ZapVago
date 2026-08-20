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
import { subHours, subMinutes } from "date-fns";
import * as Sentry from "@sentry/nextjs";

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

  // Essas falhas já são tratadas graciosamente pelas libs (sendWhatsAppMessage,
  // payments.ts, claude.ts nunca deixam o erro subir até a rota) — a captura
  // automática do Sentry na rota não veria nada, então reporta explicitamente
  // aqui, com o mesmo businessId/service que já vão pro IntegrationFailure.
  Sentry.captureException(new Error(`[${service}] ${error}`), {
    tags: { businessId, service },
    extra: context,
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

const DOWN_THRESHOLD_MINUTES = 5;

/**
 * "Indisponível agora" pros fallbacks visíveis pro cliente/dono (banner na
 * página de agendamento, alerta em Configurações): considera o serviço fora
 * do ar se a falha mais recente registrada aconteceu há menos de 5 minutos.
 * Não existe sinal de "voltou a funcionar" (só registramos falha, nunca
 * sucesso) — então o serviço volta a ser considerado "ok" sozinho assim que
 * essa janela de 5min passa sem falha nova, o que é bom o suficiente pra um
 * indicador de "provavelmente fora do ar agora", não uma prova formal.
 */
export async function isServiceDown(businessId: string, service: IntegrationService): Promise<boolean> {
  const lastFailure = await prisma.integrationFailure.findFirst({
    where: { businessId, service },
    orderBy: { occurredAt: "desc" },
    select: { occurredAt: true },
  });
  if (!lastFailure) return false;
  return lastFailure.occurredAt >= subMinutes(new Date(), DOWN_THRESHOLD_MINUTES);
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
