import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Lock } from "lucide-react";
import { endOfMonth, format } from "date-fns";
import { FadeIn } from "./FadeIn";
import { RemainingSpotsLine } from "./RemainingSpotsLine";

export function FinalCTA() {
  const offerDeadline = format(endOfMonth(new Date()), "dd/MM");
  const CHECKS = [`14 dias grátis (oferta válida até ${offerDeadline})`, "Sem cartão de crédito", "Cancele quando quiser"];

  return (
    <section className="relative overflow-hidden border-t border-surface-border">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(0,168,132,0.16), transparent 60%)" }}
      />
      <FadeIn className="relative mx-auto max-w-2xl px-4 py-24 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Comece hoje. Sua agenda agradece.</h2>
        <Link href="/register" className="mt-8 inline-block">
          <Button size="lg" className="min-h-[52px] px-10 text-base">
            Criar minha conta grátis
          </Button>
        </Link>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm text-foreground/50">
          {CHECKS.map((c) => (
            <span key={c} className="flex items-center gap-1.5">
              <Check size={14} className="text-zap-light" /> {c}
            </span>
          ))}
        </div>
        <RemainingSpotsLine />
        <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-foreground/50">
          <Lock size={14} className="text-zap-light" /> Seus dados protegidos pela LGPD
        </p>
      </FadeIn>
    </section>
  );
}
