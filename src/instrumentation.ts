// Hook de instrumentação do Next.js — carrega a configuração certa do
// Sentry pra cada runtime (Node ou Edge) assim que o servidor sobe, e
// registra o hook oficial de captura de erro de rota do App Router.
import * as Sentry from "@sentry/nextjs";

/**
 * Trava de segurança: MOCK_MODE (src/lib/mock.ts) é "ligado" por padrão —
 * fica assim até alguém setar explicitamente MOCK_MODE=false. Isso é
 * conveniente em desenvolvimento (não exige ter as contas do WhatsApp
 * Business/Anthropic configuradas), mas é perigoso em produção: em mock
 * mode, verifyPayloadSignature() (src/lib/whatsapp.ts) aceita QUALQUER
 * payload no webhook do WhatsApp sem checar a assinatura — se alguém
 * esquecer de setar a variável de ambiente no deploy de produção, o app
 * sobe "no ar" mas com a verificação de assinatura do webhook
 * silenciosamente desligada, sem nenhum aviso.
 *
 * - No deploy de produção da Vercel (VERCEL_ENV=production — só ela, nunca
 *   preview) isso é quase sempre um esquecimento, não uma escolha, e o
 *   custo de derrubar o boot é baixo (a variável é rápida de configurar) —
 *   falha alto e cedo, não em silêncio.
 * - Em qualquer outro "NODE_ENV=production" (`npm start` local — usado o
 *   tempo todo neste projeto pra testar build de produção —, self-host,
 *   preview da Vercel) pode ser intencional (soft launch em mock mode antes
 *   de configurar as integrações de verdade), então só avisa alto no log,
 *   sem derrubar o processo.
 */
function assertMockModeConfiguredForProduction() {
  if (process.env.MOCK_MODE === "false") return;
  if (process.env.NODE_ENV !== "production") return;

  const message =
    "MOCK_MODE não está como \"false\" nesta build de produção. " +
    "Com MOCK_MODE ligado (o padrão), a verificação de assinatura do webhook do WhatsApp fica desligada " +
    "e nenhuma cobrança/mensagem real é enviada. Configure MOCK_MODE=false nas variáveis de ambiente do deploy quando estiver pronto pra ir ao ar de verdade.";

  if (process.env.VERCEL_ENV === "production") {
    throw new Error(message);
  }
  console.error(`[instrumentation] AVISO: ${message}`);
}

export async function register() {
  assertMockModeConfiguredForProduction();

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
