import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "./FadeIn";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-surface-border">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(0,168,132,0.16), transparent 60%)" }}
      />
      <FadeIn className="relative mx-auto max-w-2xl px-4 py-24 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Pare de perder clientes por mensagem não respondida</h2>
        <p className="mt-4 text-lg text-foreground/70">Teste o ZapVago grátis por 7 dias. Sem compromisso.</p>
        <Link href="/register" className="mt-8 inline-block">
          <Button size="lg" className="min-h-[52px] px-10 text-base">
            Criar minha conta grátis
          </Button>
        </Link>
        <p className="mt-4 text-sm text-foreground/50">Configuração em 5 minutos · Cancele quando quiser</p>
      </FadeIn>
    </section>
  );
}
