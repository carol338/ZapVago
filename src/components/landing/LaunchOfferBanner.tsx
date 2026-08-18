"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight } from "lucide-react";
import { endOfMonth, format } from "date-fns";
import { FadeIn } from "./FadeIn";

type Spots = { total: number; filled: number; remaining: number; active: boolean };

const OFFER_DEADLINE = format(endOfMonth(new Date()), "dd/MM");

export function LaunchOfferBanner() {
  const [spots, setSpots] = useState<Spots | null>(null);

  useEffect(() => {
    fetch("/api/launch-offer/spots")
      .then((r) => r.json())
      .then(setSpots)
      .catch(() => setSpots(null));
  }, []);

  if (!spots) {
    return <div className="mx-auto mt-10 h-[260px] max-w-xl animate-pulse rounded-2xl bg-surface-hover" />;
  }

  if (!spots.active) {
    return (
      <FadeIn className="mt-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-surface-border bg-surface p-6 text-center sm:p-8">
          <p className="font-semibold">Oferta de lançamento encerrada.</p>
          <p className="mt-1 text-sm text-foreground/60">Teste grátis padrão: 7 dias.</p>
          <Link href="/register" className="mt-5 block">
            <Button className="min-h-[48px] w-full px-8 sm:w-auto">
              Criar minha conta <ArrowRight size={16} className="ml-1.5" />
            </Button>
          </Link>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn className="mt-10">
      <div className="mx-auto max-w-xl rounded-2xl border border-orange-500/40 bg-orange-500/[0.06] p-6 text-center sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-400">
          <Zap size={13} className="fill-orange-400" /> OFERTA DE LANÇAMENTO
        </span>
        <p className="mt-4 text-2xl font-bold">
          Teste grátis por 14 dias <span className="text-base font-normal text-foreground/50">(em vez de 7)</span>
        </p>
        <p className="mt-2 text-sm text-foreground/60">Apenas {spots.total} vagas para novos negócios</p>
        <p className="text-xs text-orange-400">Oferta válida até {OFFER_DEADLINE}</p>

        <div className="mx-auto mt-4 max-w-xs">
          <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
            <div className="h-full rounded-full bg-orange-500" style={{ width: `${(spots.filled / spots.total) * 100}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-foreground/50">
            <span>{spots.filled} já preenchidas</span>
            <span className="font-medium text-orange-400">{spots.remaining} restantes</span>
          </div>
        </div>

        <Link href="/register" className="mt-6 block">
          <Button className="min-h-[48px] w-full bg-orange-500 px-8 text-white hover:bg-orange-600 sm:w-auto">
            Quero minha vaga <ArrowRight size={16} className="ml-1.5" />
          </Button>
        </Link>
      </div>
    </FadeIn>
  );
}
