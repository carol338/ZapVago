"use client";

/**
 * Última linha de defesa do App Router: substitui o layout inteiro quando um
 * erro não tratado escapa de qualquer Server/Client Component. Precisa
 * renderizar as próprias tags <html>/<body> — não herda o RootLayout.
 * Reporta ao Sentry (só fora de MOCK_MODE — Sentry.init já cuida disso).
 */
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ background: "#0A0A0B", color: "#FAFAFA", fontFamily: "sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", padding: "1.5rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Algo deu errado 😕</h1>
          <p style={{ color: "#A1A1AA", maxWidth: "28rem" }}>
            Já registramos o erro e vamos dar uma olhada. Tente novamente ou volte ao início.
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => reset()}
              style={{ background: "#00A884", color: "white", border: "none", borderRadius: "0.5rem", padding: "0.625rem 1.25rem", fontWeight: 600, cursor: "pointer" }}
            >
              Tentar novamente
            </button>
            <a
              href="/"
              style={{ background: "transparent", color: "#FAFAFA", border: "1px solid #27272A", borderRadius: "0.5rem", padding: "0.625rem 1.25rem", fontWeight: 600, textDecoration: "none" }}
            >
              Voltar ao início
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
