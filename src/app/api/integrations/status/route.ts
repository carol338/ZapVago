/**
 * GET /api/integrations/status — alimenta o painel "Status das Integrações"
 * em Configurações. Só olha falhas registradas (IntegrationFailure); como
 * sucessos não são logados, "ok" aqui significa "nunca falhou" — uma falha
 * isolada de dias atrás continua marcando o serviço, o que é intencional:
 * é melhor o dono conferir de novo do que a tela ficar cega pra um problema real.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { subHours } from "date-fns";
import type { IntegrationService } from "@/lib/alerting";

const SERVICES: IntegrationService[] = ["whatsapp", "mercadopago", "claude"];

export async function GET() {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const since24h = subHours(new Date(), 24);

  const status = await Promise.all(
    SERVICES.map(async (service) => {
      const [lastFailure, count24h] = await Promise.all([
        prisma.integrationFailure.findFirst({ where: { businessId, service }, orderBy: { occurredAt: "desc" } }),
        prisma.integrationFailure.count({ where: { businessId, service, occurredAt: { gte: since24h } } }),
      ]);
      return {
        service,
        ok: !lastFailure,
        lastFailureAt: lastFailure?.occurredAt ?? null,
        lastError: lastFailure?.error ?? null,
        count24h,
      };
    })
  );

  return NextResponse.json(status);
}
