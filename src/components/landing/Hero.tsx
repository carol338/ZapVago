import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, Check, ArrowRight, Bell, CreditCard, AlertTriangle } from "lucide-react";
import { FadeIn } from "./FadeIn";

const DIAS = ["S", "T", "Q", "Q", "S", "S", "D"];
const SEMANA: string[][] = [
  ["#00A884", "#3B82F6", "#00A884"],
  ["#3B82F6", "#F59E0B", "#00A884", "#3B82F6"],
  ["#00A884", "#00A884"],
  ["#F59E0B", "#3B82F6", "#00A884", "#F59E0B"],
  ["#00A884", "#3B82F6", "#F59E0B"],
  ["#3B82F6", "#00A884"],
  ["#F59E0B"],
];

const MICROCOPY = ["Teste grátis de 14 dias", "Sem cartão", "Cancele quando quiser"];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Fundo: gradiente escuro com leve tom verde + grid sutil + glows nos cantos */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(135deg, rgba(0,168,132,0.05), transparent 50%)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-zap/25 blur-[100px]" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-zap/20 blur-[100px]" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2">
        <FadeIn direction="left" className="text-center lg:text-left">
          <span className="hero-badge-pulse mb-5 inline-flex items-center gap-1.5 rounded-full bg-zap/10 px-3 py-1.5 text-xs font-medium text-zap-light">
            <Zap size={13} className="fill-zap-light" /> Atendimento 24/7 no WhatsApp
          </span>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Seu negócio atendendo
            <br />
            no piloto automático
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-foreground/70 sm:text-xl lg:mx-0">
            O ZapVago agenda, cobra e fideliza seus clientes pelo WhatsApp enquanto você foca no que importa: atender
            bem.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link href="/register">
              <Button size="lg" className="min-h-[52px] w-full whitespace-nowrap px-8 text-base sm:w-auto">
                Quero minha agenda lotada <ArrowRight size={18} className="ml-1.5" />
              </Button>
            </Link>
            <Link href="#demonstracao">
              <Button
                variant="secondary"
                size="lg"
                className="min-h-[52px] w-full whitespace-nowrap border border-surface-border px-8 text-base sm:w-auto"
              >
                Ver como funciona (2 min)
              </Button>
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm text-foreground/50 lg:justify-start">
            {MICROCOPY.map((m, i) => (
              <FadeIn key={m} delay={400 + i * 120} direction="up">
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-zap-light" /> {m}
                </span>
              </FadeIn>
            ))}
          </div>
        </FadeIn>

        <FadeIn direction="right" delay={150} className="relative">
          {/* Mockup do dashboard */}
          <div className="relative mx-auto max-w-md rounded-2xl border border-surface-border bg-surface p-4 shadow-2xl">
            <div className="mb-3 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-risk-high/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-risk-mid/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-risk-low/60" />
              <span className="ml-2 text-xs text-foreground/40">Agenda da semana</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 rounded-lg bg-background p-3">
              {DIAS.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-foreground/40">{d}</span>
                  <div className="flex flex-col gap-1">
                    {SEMANA[i].map((color, j) => (
                      <span key={j} className="h-2.5 w-4 rounded-sm sm:w-5" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg bg-zap/10 px-3 py-2.5">
              <span className="text-xs text-foreground/60">Faturamento hoje</span>
              <span className="text-sm font-bold text-zap-light">R$ 385,00</span>
            </div>
          </div>

          {/* Elementos flutuantes */}
          <div
            className="hero-float absolute -right-3 -top-6 hidden max-w-[210px] items-center gap-2 rounded-xl border border-surface-border bg-surface px-3 py-2 shadow-xl sm:flex"
            style={{ animationDelay: "0s" }}
          >
            <Bell size={14} className="shrink-0 text-zap-light" />
            <span className="text-xs font-medium leading-tight">Novo agendamento: Maria - Luzes - 14h</span>
          </div>
          <div
            className="hero-float absolute -bottom-5 -left-5 hidden items-center gap-2 rounded-xl border border-surface-border bg-surface px-3 py-2 shadow-xl sm:flex"
            style={{ animationDelay: "0.6s" }}
          >
            <CreditCard size={14} className="text-zap-light" />
            <span className="text-xs font-medium">Pix recebido: R$ 171</span>
          </div>
          <div
            className="hero-float absolute -right-6 bottom-1/4 hidden items-center gap-2 rounded-xl border border-risk-mid/30 bg-surface px-3 py-2 shadow-xl sm:flex"
            style={{ animationDelay: "1.2s" }}
          >
            <AlertTriangle size={14} className="text-risk-mid" />
            <span className="text-xs font-medium text-risk-mid">Risco de falta: 70%</span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
