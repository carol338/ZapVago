"use client";

/**
 * Error boundary de rota (App Router) — captura qualquer erro não tratado
 * numa página/Server Component ABAIXO do RootLayout (que continua de pé,
 * então header/fontes/tema seguem intactos). Diferente de global-error.tsx,
 * que só entra em ação se o erro estourar no próprio RootLayout — aí sim
 * é preciso substituir tudo, <html> incluso.
 */
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCw } from "lucide-react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[error.tsx]", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-risk-high/15 text-risk-high">
        <AlertTriangle size={26} />
      </div>
      <div>
        <h1 className="text-xl font-bold">Algo deu errado</h1>
        <p className="mt-1 max-w-sm text-sm text-foreground/60">
          Já registramos o problema e vamos dar uma olhada. Tenta de novo — na maioria das vezes resolve.
        </p>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => reset()}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-zap px-5 text-sm font-semibold text-white transition-colors hover:bg-zap-dark"
        >
          <RotateCw size={16} /> Tentar novamente
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-surface-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
        >
          <Home size={16} /> Voltar para o início
        </Link>
      </div>
    </main>
  );
}
