"use client";

/** Card "🎁 Fidelidade" do dashboard principal (Bloco 3 Parte 3.5). */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";

export function LoyaltySummaryCard() {
  const [summary, setSummary] = useState<{ eligibleClients: number; rewardsThisMonth: number; hasRules: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/loyalty/summary").then((r) => r.json()).then(setSummary);
  }, []);

  if (!summary || !summary.hasRules) return null;

  return (
    <Card>
      <div className="mb-2 flex items-center gap-2">
        <Gift className="text-zap" size={18} />
        <h3 className="font-semibold">Fidelidade</h3>
      </div>
      <div className="mb-3 space-y-0.5 text-sm text-foreground/70">
        <p>Clientes elegíveis: <span className="font-semibold text-foreground">{summary.eligibleClients}</span></p>
        <p>Prêmios concedidos este mês: <span className="font-semibold text-foreground">{summary.rewardsThisMonth}</span></p>
      </div>
      <Link href="/dashboard/loyalty">
        <Button size="sm" variant="secondary" className="w-full">Ver regras</Button>
      </Link>
    </Card>
  );
}
