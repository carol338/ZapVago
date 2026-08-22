import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DemoBanner() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 border-b border-zap/30 bg-zap px-4 py-2.5 text-center text-sm font-medium text-white sm:flex-row sm:gap-3">
      <span>👆 Esta é uma demonstração. Crie sua conta para usar com seu próprio negócio.</span>
      <Link href="/register" className="shrink-0">
        <Button size="sm" variant="secondary" className="border-0 bg-white text-zap-dark hover:bg-white/90">
          Criar conta grátis <ArrowRight size={14} className="ml-1" />
        </Button>
      </Link>
    </div>
  );
}
