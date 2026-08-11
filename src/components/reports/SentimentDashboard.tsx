"use client";

/**
 * Painel de Sentimentos — Diferencial 4.
 * Mostra a distribuição de sentimentos das conversas da semana e a lista
 * de clientes insatisfeitos, com atalho para ver a conversa completa.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SentimentDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/reports/sentiment?period=7").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>😊 Análise de sentimentos (últimos 7 dias)</CardTitle>
      </CardHeader>
      <div className="mb-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-2xl">😊</p>
          <p className="font-bold text-risk-low">{data.positivos} ({data.positivosPct}%)</p>
        </div>
        <div>
          <p className="text-2xl">😐</p>
          <p className="font-bold text-foreground/70">{data.neutros} ({data.neutrosPct}%)</p>
        </div>
        <div>
          <p className="text-2xl">😤</p>
          <p className="font-bold text-risk-high">{data.negativos} ({data.negativosPct}%)</p>
        </div>
      </div>

      {data.clientesInsatisfeitos?.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-foreground/70">Clientes insatisfeitos:</p>
          <div className="space-y-2">
            {data.clientesInsatisfeitos.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg bg-background p-2.5 text-sm">
                <div>
                  <p className="font-medium">{c.clientName}</p>
                  {c.summary && <p className="text-xs text-foreground/50">"{c.summary}"</p>}
                </div>
                <Link href="/dashboard/conversations">
                  <Button size="sm" variant="secondary">Ver conversa</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
