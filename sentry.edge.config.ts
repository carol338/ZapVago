// Configuração do Sentry no runtime Edge (middleware.ts) — carregado por
// src/instrumentation.ts quando NEXT_RUNTIME=edge.
import * as Sentry from "@sentry/nextjs";
import { isMockMode } from "@/lib/mock";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Nunca manda evento em MOCK_MODE — ver sentry.client.config.ts.
  enabled: !isMockMode(),
  tracesSampleRate: 0.2,
  debug: false,
});
