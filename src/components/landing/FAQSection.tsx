"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FadeIn } from "./FadeIn";

const FAQS = [
  {
    q: "Meu cliente precisa baixar algum aplicativo?",
    a: "Não. Tudo acontece no WhatsApp que ele já usa. Ele manda mensagem, o assistente responde e agenda. Simples assim.",
  },
  {
    q: "Quanto tempo leva para configurar?",
    a: "Menos de 5 minutos. Você cria a conta, conecta o WhatsApp e cadastra seus serviços. Pronto.",
  },
  {
    q: "Preciso de cartão de crédito para testar?",
    a: "Não. O teste é totalmente grátis. Você só paga se continuar depois do período de teste.",
  },
  {
    q: "Funciona para o meu tipo de negócio?",
    a: "Se você atende por hora marcada, sim. Barbearias, salões, clínicas, pet shops, consultórios — todos usam.",
  },
  {
    q: "Como recebo os pagamentos dos clientes?",
    a: "Direto na sua conta via Pix ou cartão. O ZapVago processa e você recebe em até 2 dias úteis.",
  },
  {
    q: "O que acontece se um cliente faltar?",
    a: "Com o pagamento antecipado, as faltas caem 80%. E você ainda tem a previsão de faltas para agir antes.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Sem multa, sem perguntas, sem burocracia. É só cancelar nas configurações.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Sim. Usamos criptografia de ponta a ponta e seguimos a LGPD. Seus dados e os dos seus clientes estão protegidos.",
  },
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
