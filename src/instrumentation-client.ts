// Configuração do Sentry no navegador — convenção do Next.js (App Router)
// pra instrumentação client-side, carregada automaticamente antes de
// qualquer outro código da aplicação rodar no navegador.
import * as Sentry from "@sentry/nextjs";
import { isMockMode } from "@/lib/mock";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Nunca manda evento em MOCK_MODE — não é bug de produção, é o app rodando
  // simulado de propósito, e encheria o painel do Sentry com ruído de dev.
  enabled: !isMockMode(),
  tracesSampleRate: 0.2,
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
