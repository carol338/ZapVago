import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, Check, CreditCard, Scissors, Sparkles, Heart } from "lucide-react";
import { FadeIn } from "./FadeIn";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(circle at 20% 15%, rgba(0,168,132,0.14), transparent 55%)" }}
      />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2">
        <FadeIn>
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-zap/10 px-3 py-1.5 text-xs font-medium text-zap-light">
            <Zap size={13} className="fill-zap-light" /> Atendimento 24/7 no WhatsApp
          </span>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Seu salão atendendo como uma empresa grande
          </h1>
          <p className="mt-5 max-w-xl text-lg text-foreground/70 sm:text-xl">
            O ZapVago agenda, lembra, cobra e fideliza seus clientes pelo WhatsApp — enquanto você foca no que faz de
            melhor.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="min-h-[52px] w-full px-8 text-base sm:w-auto">
                Testar grátis por 7 dias
              </Button>
            </Link>
            <Link href="#demonstracao">
              <Button variant="secondary" size="lg" className="min-h-[52px] w-full border border-surface-border px-8 text-base sm:w-auto">
                Ver demonstração
              </Button>
            </Link>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-sm text-foreground/50">
            <Check size={14} className="text-zap-light" /> Sem cartão de crédito · Configuração em 5 minutos
          </p>
        </FadeIn>

        <FadeIn delay={150} className="relative">
          {/* Mockup do dashboard */}
          <div className="relative mx-auto max-w-md rounded-2xl border border-surface-border bg-surface p-4 shadow-2xl">
            <div className="mb-3 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-risk-high/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-risk-mid/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-risk-low/60" />
              <span className="ml-2 text-xs text-foreground/40">Agenda de hoje</span>
            </div>
            <div className="space-y-2">
              {[
                { time: "09:00", name: "Maria Silva", service: "Corte + Escova", color: "#00A884" },
                { time: "10:30", name: "João Pedro", service: "Barba", color: "#3B82F6" },
                { time: "14:00", name: "Ana Costa", service: "Hidratação", color: "#F59E0B" },
              ].map((a) => (
                <div
                  key={a.time}
                  className="flex items-center justify-between rounded-lg border-l-4 bg-background px-3 py-2.5 text-sm"
                  style={{ borderLeftColor: a.color }}
                >
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-foreground/50">{a.service}</p>
                  </div>
                  <span className="text-xs font-medium text-foreground/60">{a.time}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-zap/10 px-3 py-2.5">
              <span className="text-xs text-foreground/60">Faturamento hoje</span>
              <span className="text-sm font-bold text-zap-light">R$ 385,00</span>
            </div>
          </div>

          {/* Elementos flutuantes */}
          <div className="absolute -right-3 -top-4 hidden animate-[fade-in_600ms_ease] items-center gap-2 rounded-xl border border-surface-border bg-surface px-3 py-2 shadow-xl sm:flex">
            <Check size={14} className="text-zap-light" />
            <span className="text-xs font-medium">Novo agendamento</span>
          </div>
          <div className="absolute -bottom-4 -left-4 hidden animate-[fade-in_600ms_ease] items-center gap-2 rounded-xl border border-surface-border bg-surface px-3 py-2 shadow-xl sm:flex">
            <CreditCard size={14} className="text-zap-light" />
            <span className="text-xs font-medium">Pix confirmado</span>
          </div>
          <div className="absolute right-6 bottom-1/3 hidden gap-1.5 sm:flex">
            {[Scissors, Sparkles, Heart].map((Icon, i) => (
              <span key={i} className="flex h-8 w-8 items-center justify-center rounded-full border border-surface-border bg-surface shadow-lg">
                <Icon size={14} className="text-zap-light" />
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
