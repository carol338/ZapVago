import { Scissors, Sparkles, Stethoscope, PawPrint, ShieldCheck, Lock, Headset, Star } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import { FadeIn } from "./FadeIn";

const STATS = [
  { value: 1200, prefix: "+", label: "negócios ativos" },
  { value: 45000, prefix: "+", label: "agendamentos por mês" },
  { value: 80, prefix: "+", suffix: "%", label: "menos faltas" },
  { value: 2, prefix: "+R$ ", suffix: "M", label: "processados" },
  { value: 4.9, decimals: 1, label: "avaliação" },
  { value: 98, suffix: "%", label: "satisfação" },
];

const SEGMENTOS = [
  { icon: Scissors, label: "Barbearias" },
  { icon: Sparkles, label: "Salões" },
  { icon: Stethoscope, label: "Clínicas" },
  { icon: PawPrint, label: "Pet Shops" },
];

const SELOS = [
  { icon: ShieldCheck, label: "LGPD Compliant" },
  { icon: Lock, label: "Dados criptografados" },
  { icon: Headset, label: "Suporte em português" },
];

export function SocialProof() {
  return (
    <section className="border-y border-surface-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14">
        {/* Números animados */}
        <FadeIn>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-zap-light sm:text-[2rem]">
                  {s.label === "avaliação" ? (
                    <span className="inline-flex items-center justify-center gap-1">
                      <Star size={24} className="fill-zap-light text-zap-light" />
                      <AnimatedNumber value={s.value} decimals={s.decimals ?? 0} suffix={s.suffix} />
                    </span>
                  ) : (
                    <AnimatedNumber value={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals ?? 0} />
                  )}
                </p>
                <p className="mt-1 text-sm text-foreground/50">{s.label}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Segmentos atendidos */}
        <FadeIn delay={100}>
          <div className="mt-12 border-t border-surface-border pt-10 text-center">
            <p className="text-sm text-foreground/50">Usado por barbearias, salões, clínicas e pet shops</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
              {SEGMENTOS.map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-1.5 text-foreground/60">
                  <s.icon size={22} />
                  <span className="text-xs font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Selos de confiança */}
        <FadeIn delay={180}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-surface-border pt-8 text-xs text-foreground/50">
            {SELOS.map((s) => (
              <span key={s.label} className="flex items-center gap-1.5">
                <s.icon size={14} className="text-zap-light" /> {s.label}
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
