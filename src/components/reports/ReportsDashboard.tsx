"use client";

/**
 * Painel de relatórios — faturamento semanal, desempenho por profissional
 * e por serviço (gráficos Recharts), além do relatório mensal em texto.
 */
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SentimentDashboard } from "./SentimentDashboard";
import { startOfWeek, endOfWeek } from "date-fns";
import { Send } from "lucide-react";

export function ReportsDashboard() {
  const [weekly, setWeekly] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [monthlyMessage, setMonthlyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
    const end = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
    fetch(`/api/reports/weekly?start=${start}&end=${end}`).then((r) => r.json()).then((d) => setWeekly(d.series));
    fetch("/api/reports/professionals?period=30").then((r) => r.json()).then((d) => setProfessionals(d.data));
    fetch("/api/reports/services?period=30").then((r) => r.json()).then((d) => setServices(d.data));
    fetch("/api/reports/monthly").then((r) => r.json()).then((d) => setMonthlyMessage(d.message));
  }, []);

  async function sendMonthlyReport() {
    setSending(true);
    await fetch("/api/reports/monthly/send", { method: "POST" });
    setSending(false);
    setSent(true);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Faturamento da semana</CardTitle></CardHeader>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weekly}>
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
          <CardHeader><CardTitle>Desempenho por profissional (30d)</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={professionals} layout="vertical">
              <XAxis type="number" stroke="#8888" fontSize={12} />
              <YAxis type="category" dataKey="nome" stroke="#8888" fontSize={12} width={70} />
              <Tooltip contentStyle={{ background: "#141416", border: "1px solid #26262A" }} />
              <Bar dataKey="faturamento" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <CardHeader><CardTitle>Serviços mais vendidos (30d)</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={services} layout="vertical">
              <XAxis type="number" stroke="#8888" fontSize={12} />
              <YAxis type="category" dataKey="nome" stroke="#8888" fontSize={12} width={90} />
              <Tooltip contentStyle={{ background: "#141416", border: "1px solid #26262A" }} />
              <Bar dataKey="quantidade" fill="#F59E0B" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <SentimentDashboard />

      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <CardTitle>📊 Receita do mês</CardTitle>
          <Button size="sm" variant="secondary" onClick={sendMonthlyReport} disabled={sending || sent}>
            <Send size={14} className="mr-1" />
            {sent ? "Enviado ✅" : sending ? "Enviando..." : "Enviar agora"}
          </Button>
        </div>
        <pre className="whitespace-pre-wrap rounded-lg bg-background p-3 text-sm text-foreground/80">{monthlyMessage}</pre>
      </Card>
    </div>
  );
}
