import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "./FadeIn";

export function PreFAQCTA() {
  return (
    <FadeIn className="mx-auto max-w-2xl px-4 pb-4">
      <div className="rounded-2xl border border-zap/25 bg-zap/[0.06] p-8 text-center">
        <h3 className="text-xl font-bold sm:text-2xl">Pronto para sua agenda lotar sozinha?</h3>
        <Link href="/register" className="mt-5 inline-block">
          <Button size="lg" className="min-h-[52px] px-8 text-base">
            Testar grátis por 14 dias
          </Button>
        </Link>
        <p className="mt-3 text-sm text-foreground/50">Sem cartão · 5 min de configuração</p>
      </div>
    </FadeIn>
  );
}
