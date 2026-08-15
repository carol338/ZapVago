"use client";

/**
 * Painel de Sentimentos — Diferencial 4 / Bloco 2 Parte 4.
 * Distribuição de sentimentos (gráfico de pizza), tendência vs período
 * anterior, e lista de clientes insatisfeitos com atalho pra conversa.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

const COLORS = { positive: "#10B981", neutral: "#8888A0", negative: "#EF4444" };

export function SentimentDashboard() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/reports/sentiment?period=${period}`).then((r) => r.json()).then(setData);
  }, [period]);

  if (!data) return null;

  const pieData = [
    { key: "positive", name: "Positivos", value: data.positivos },
    { key: "neutral", name: "Neutros", value: data.neutros },
    { key: "negative", name: "Negativos", value: data.negativos },
  ].filter((d) => d.value > 0);

  const TrendIcon = data.tendencia === "melhorou" ? TrendingDown : data.tendencia === "piorou" ? TrendingUp : Minus;
  const trendColor = data.tendencia === "melhorou" ? "text-risk-low" : data.tendencia === "piorou" ? "text-risk-high" : "text-foreground/50";
  const trendLabel = data.tendencia === "melhorou" ? "Melhorou" : data.tendencia === "piorou" ? "Piorou" : "Estável";

  return (
    <Card>
      <CardHeader className="flex-wrap gap-2">
        <CardTitle>😊 Análise de Sentimentos</CardTitle>
        <Select value={period} onChange={(e) => setPeriod(Number(e.target.value))} className="w-32">
          <option value={7}>7 dias</option>
          <option value={15}>15 dias</option>
          <option value={30}>30 dias</option>
          <option value={90}>90 dias</option>
        </Select>
      </CardHeader>

      {data.total === 0 ? (
        <p className="py-4 text-center text-sm text-foreground/40">Nenhuma conversa nesse período ainda.</p>
      ) : (
        <>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-40 w-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={35} outerRadius={65} paddingAngle={2}>
                    {pieData.map((d) => (
                      <Cell key={d.key} fill={COLORS[d.key as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#141416", border: "1px solid #26262A", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5 text-sm">
              <p className="flex items-center gap-2">
                😊 Positivos: <span className="font-bold text-risk-low">{data.positivosPct}%</span> ({data.positivos})
              </p>
              <p className="flex items-center gap-2">
                😐 Neutros: <span className="font-bold text-foreground/70">{data.neutrosPct}%</span> ({data.neutros})
              </p>
              <p className="flex items-center gap-2">
                😤 Negativos: <span className="font-bold text-risk-high">{data.negativosPct}%</span> ({data.negativos})
              </p>
              <p className={`mt-2 flex items-center gap-1.5 text-xs ${trendColor}`}>
                <TrendIcon size={14} /> {trendLabel} vs período anterior ({data.negativosPctPeriodoAnterior}% negativos)
              </p>
            </div>
          </div>

          {data.clientesInsatisfeitos?.length > 0 && (
            <div className="mt-4 border-t border-surface-border pt-4">
              <p className="mb-2 text-sm font-medium text-foreground/70">Clientes insatisfeitos:</p>
              <div className="space-y-2">
                {data.clientesInsatisfeitos.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-background p-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.clientName}</p>
                      {c.summary && <p className="truncate text-xs text-foreground/50">&quot;{c.summary}&quot;</p>}
                    </div>
                    <Link href={`/dashboard/conversations?open=${c.id}`} className="shrink-0">
                      <Button size="sm" variant="secondary">Ver conversa</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
