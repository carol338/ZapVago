import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { FadeIn } from "./FadeIn";

const PLANOS = [
  {
    nome: "Grátis",
    preco: "R$ 0",
    features: ["50 agendamentos/mês", "1 profissional", "WhatsApp básico"],
    cta: "Começar grátis",
    href: "/register",
  },
  {
    nome: "Pro",
    preco: "R$ 147",
    destaque: true,
    features: ["Agendamentos ilimitados", "5 profissionais", "Pix + link personalizado", "Lista de espera", "Fidelidade"],
    cta: "Começar teste grátis",
    href: "/register",
  },
  {
    nome: "Business",
    preco: "R$ 297",
    features: ["Profissionais ilimitados", "Cartão + Pix", "Feirão", "Sentimentos", "Previsão de faltas", "Relatórios avançados"],
    cta: "Falar com especialista",
    href: "mailto:contato@zapvago.app",
  },
];

export function Pricing() {
  return (
    <section id="planos" className="mx-auto max-w-6xl px-4 py-20">
      <FadeIn>
        <div className="mb-4 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zap/10 px-3 py-1.5 text-xs font-semibold text-zap-light">
            🚀 Lançamento 2026 — Preço promocional
          </span>
        </div>
        <h2 className="text-center text-3xl font-bold sm:text-4xl">Planos e preços</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-foreground/60">Comece grátis. Cresça no seu ritmo.</p>
      </FadeIn>
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {PLANOS.map((p, i) => (
          <FadeIn key={p.nome} delay={i * 100}>
            <Card
              className={cn(
                "relative h-full transition-transform duration-200 hover:scale-[1.02]",
                p.destaque && "border-zap ring-1 ring-zap"
              )}
            >
              {p.destaque && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zap px-3 py-1 text-xs font-semibold text-white">
                  Mais popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{p.nome}</h3>
              <p className="mt-2 text-3xl font-bold">
                {p.preco}
                <span className="text-base font-normal text-foreground/50">/mês</span>
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-foreground/70">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={15} className="mt-0.5 shrink-0 text-zap-light" /> {f}
                  </li>
                ))}
              </ul>
              <Link href={p.href} className="mt-6 block">
                <Button variant={p.destaque ? "primary" : "secondary"} className="w-full">
                  {p.cta}
                </Button>
              </Link>
            </Card>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={300} className="mt-8 flex justify-center">
        <div className="flex max-w-md items-start gap-3 rounded-xl border border-surface-border bg-surface px-5 py-4 text-left">
          <Lock size={20} className="mt-0.5 shrink-0 text-zap-light" />
          <div>
            <p className="text-sm font-semibold">Garantia ZapVago</p>
            <p className="mt-0.5 text-sm text-foreground/60">
              Teste por 14 dias. Se não gostar, cancele sem pagar nada. Sem perguntas.
            </p>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
