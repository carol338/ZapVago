"use client";

/**
 * Error boundary só do painel — Next renderiza isso DENTRO de
 * dashboard/layout.tsx (Sidebar/BottomNav continuam visíveis), então um
 * erro numa página específica (ex: Relatórios) não derruba o painel
 * inteiro nem cai no error.tsx genérico da raiz.
 */
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarDays, RotateCw } from "lucide-react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[dashboard/error.tsx]", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-risk-high/15 text-risk-high">
        <AlertTriangle size={26} />
      </div>
      <div>
        <h1 className="text-lg font-bold">Algo deu errado nessa tela</h1>
        <p className="mt-1 max-w-sm text-sm text-foreground/60">
          Já registramos o problema. O resto do painel continua funcionando normalmente.
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
          href="/dashboard"
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-surface-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
        >
          <CalendarDays size={16} /> Voltar para a agenda
        </Link>
      </div>
    </div>
  );
}
