"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FadeIn } from "./FadeIn";

const FAQS = [
  { q: "Meu cliente precisa baixar app?", a: "Não, tudo pelo WhatsApp — ele já usa todo dia." },
  { q: "Quanto tempo leva para configurar?", a: "Cerca de 5 minutos: cadastro, serviços e horários." },
  { q: "Precisa cartão de crédito para testar?", a: "Não, o teste de 7 dias é grátis, sem cartão." },
  { q: "Funciona para o meu tipo de negócio?", a: "Sim — qualquer negócio que cobra por hora ou serviço agendado." },
  { q: "Posso cancelar quando quiser?", a: "Sim, sem multa e sem fidelidade." },
  { q: "Como recebo os pagamentos?", a: "Pix e cartão, processados via Mercado Pago." },
  { q: "Meus dados estão seguros?", a: "Sim, com criptografia de ponta a ponta." },
  { q: "Preciso de algum equipamento especial?", a: "Não, só um celular com WhatsApp." },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <FadeIn>
        <h2 className="text-center text-3xl font-bold sm:text-4xl">Perguntas frequentes</h2>
      </FadeIn>
      <div className="mt-10 space-y-2.5">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <FadeIn key={f.q} delay={Math.min(i, 4) * 40}>
              <div className="overflow-hidden rounded-xl border border-surface-border bg-surface">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                >
                  <span className="font-medium">{f.q}</span>
                  <ChevronDown size={18} className={cn("shrink-0 text-foreground/40 transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && <p className="px-4 pb-4 text-sm text-foreground/60">{f.a}</p>}
              </div>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}
