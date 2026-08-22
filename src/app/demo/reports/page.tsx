"use client";

/**
 * Relatórios da demo — mesmos gráficos (Recharts) do painel real, mas
 * alimentados por src/lib/demo-data.ts. "Enviar agora" só simula o toast
 * de confirmação, sem chamar a API real de verdade.
 */
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Check } from "lucide-react";
import { DEMO_REPORTS } from "@/lib/demo-data";

const SENTIMENT_COLORS = { positive: "#10B981", neutral: "#8888A0", negative: "#EF4444" };

export default function DemoReportsPage() {
  const [sent, setSent] = useState(false);

  const pieData = [
    { key: "positive", name: "Positivos", value: DEMO_REPORTS.sentiment.positivos },
    { key: "neutral", name: "Neutros", value: DEMO_REPORTS.sentiment.neutros },
    { key: "negative", name: "Negativos", value: DEMO_REPORTS.sentiment.negativos },
  ];
  const total = DEMO_REPORTS.sentiment.positivos + DEMO_REPORTS.sentiment.neutros + DEMO_REPORTS.sentiment.negativos;

  function sendReport() {
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Relatórios</h1>

      <Card>
        <CardHeader><CardTitle>Faturamento da semana</CardTitle></CardHeader>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={DEMO_REPORTS.weekly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#26262A" />
            <XAxis dataKey="dia" stroke="#8888" fontSize={12} />
            <YAxis stroke="#8888" fontSize={12} />
            <Tooltip contentStyle={{ background: "#141416", border: "1px solid #26262A" }} />
            <Bar dataKey="faturamento" fill="#00A884" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Desempenho por profissional (semana)</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DEMO_REPORTS.professionals} layout="vertical">
              <XAxis type="number" stroke="#8888" fontSize={12} />
              <YAxis type="category" dataKey="nome" stroke="#8888" fontSize={12} width={70} />
              <Tooltip contentStyle={{ background: "#141416", border: "1px solid #26262A" }} />
              <Bar dataKey="faturamento" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <CardHeader><CardTitle>Serviços mais vendidos (semana)</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DEMO_REPORTS.services} layout="vertical">
              <XAxis type="number" stroke="#8888" fontSize={12} />
              <YAxis type="category" dataKey="nome" stroke="#8888" fontSize={12} width={90} />
              <Tooltip contentStyle={{ background: "#141416", border: "1px solid #26262A" }} />
              <Bar dataKey="quantidade" fill="#F59E0B" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>😊 Análise de Sentimentos</CardTitle></CardHeader>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={35} outerRadius={65} paddingAngle={2}>
                  {pieData.map((d) => (
                    <Cell key={d.key} fill={SENTIMENT_COLORS[d.key as keyof typeof SENTIMENT_COLORS]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#141416", border: "1px solid #26262A" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 text-sm">
            <p>😊 Positivos: <span className="font-semibold text-risk-low">{Math.round((DEMO_REPORTS.sentiment.positivos / total) * 100)}%</span> ({DEMO_REPORTS.sentiment.positivos})</p>
            <p>😐 Neutros: <span className="font-semibold">{Math.round((DEMO_REPORTS.sentiment.neutros / total) * 100)}%</span> ({DEMO_REPORTS.sentiment.neutros})</p>
            <p>😤 Negativos: <span className="font-semibold text-risk-high">{Math.round((DEMO_REPORTS.sentiment.negativos / total) * 100)}%</span> ({DEMO_REPORTS.sentiment.negativos})</p>
            <p className="text-risk-low">Tendência: melhorou vs período anterior</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <CardTitle>📊 Receita do mês</CardTitle>
          <Button size="sm" variant="secondary" onClick={sendReport}>
            {sent ? <Check size={14} className="mr-1" /> : <Send size={14} className="mr-1" />}
            {sent ? "Enviado ✅" : "Enviar agora"}
          </Button>
        </div>
        <pre className="whitespace-pre-wrap rounded-lg bg-background p-3 text-sm text-foreground/80">{DEMO_REPORTS.monthlyMessage}</pre>
      </Card>
    </div>
  );
}
