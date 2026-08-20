import Link from "next/link";
import { MessageCircle, Home } from "lucide-react";

export const metadata = { title: "Página não encontrada — ZapVago" };

/** 404 — cai aqui tanto em rota inexistente quanto em qualquer notFound() chamado por uma página. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground">
      <MessageCircle className="text-zap" size={40} />
      <div>
        <p className="text-6xl font-bold text-foreground/20">404</p>
        <h1 className="mt-2 text-xl font-bold">Página não encontrada</h1>
        <p className="mt-1 text-sm text-foreground/60">O endereço que você tentou acessar não existe ou foi movido.</p>
      </div>
      <Link
        href="/"
        className="mt-2 inline-flex h-11 items-center gap-2 rounded-lg bg-zap px-5 text-sm font-semibold text-white transition-colors hover:bg-zap-dark"
      >
        <Home size={16} /> Voltar para o início
      </Link>
    </main>
  );
}
