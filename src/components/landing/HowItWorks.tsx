import { Fragment } from "react";
import { MessageCircle, Settings, Palmtree, ChevronRight } from "lucide-react";
import { FadeIn } from "./FadeIn";

const PASSOS = [
  { icon: MessageCircle, titulo: "Conecte", desc: "Conecte o WhatsApp do seu negócio", nota: "Leva 5 minutos" },
  { icon: Settings, titulo: "Configure", desc: "Cadastre serviços e profissionais", nota: "Templates prontos por categoria" },
  { icon: Palmtree, titulo: "Relaxe", desc: "O ZapVago faz o resto", nota: "Agenda, cobra e fideliza sozinho" },
];

export function HowItWorks() {
  return (
    <section className="border-y border-surface-border bg-surface/30">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <FadeIn>
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Como funciona</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-foreground/60">
            Três passos e você nunca mais abre o WhatsApp pra agendar.
          </p>
        </FadeIn>

        <div className="mt-12 flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
          {PASSOS.map((p, i) => (
            <Fragment key={p.titulo}>
              <FadeIn delay={i * 120} className="flex-1">
                <div className="flex h-full flex-col items-center rounded-2xl border border-surface-border bg-surface p-6 text-center">
                  <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zap/10 text-zap-light">
                    <p.icon size={26} />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground/40">Passo {i + 1}</p>
                  <h3 className="mt-1 text-lg font-bold">{p.titulo}</h3>
                  <p className="mt-2 text-sm text-foreground/70">{p.desc}</p>
                  <p className="mt-1 text-xs text-zap-light">{p.nota}</p>
                </div>
              </FadeIn>
              {i < PASSOS.length - 1 && (
                <ChevronRight size={22} className="arrow-flow mx-auto hidden shrink-0 text-zap-light lg:block" style={{ animationDelay: `${i * 0.2}s` }} />
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
