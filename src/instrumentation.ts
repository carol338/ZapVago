// Hook de instrumentação do Next.js — carrega a configuração certa do
// Sentry pra cada runtime (Node ou Edge) assim que o servidor sobe, e
// registra o hook oficial de captura de erro de rota do App Router.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
