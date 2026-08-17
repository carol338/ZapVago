import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "./FadeIn";

export function MidCTA() {
  return (
    <FadeIn className="mx-auto max-w-6xl px-4 pb-4">
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-zap/25 bg-zap/[0.06] p-6 sm:flex-row">
        <p className="text-center font-medium sm:text-left">Pronto pra parar de perder agendamento por demora na resposta?</p>
        <Link href="/register">
          <Button className="min-h-[48px] px-6 whitespace-nowrap">
            Testar grátis por 7 dias <ArrowRight size={16} className="ml-1.5" />
          </Button>
        </Link>
      </div>
    </FadeIn>
  );
}
