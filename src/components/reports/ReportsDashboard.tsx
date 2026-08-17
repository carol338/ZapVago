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
import { Send, Loader2, Check, AlertTriangle } from "lucide-react";

type WhatsAppSendResult = { success: boolean; mocked: boolean; reason?: "mock_mode" | "not_configured"; error?: string } | null;

export function ReportsDashboard() {
  const [weekly, setWeekly] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [monthlyMessage, setMonthlyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [lastSend, setLastSend] = useState<{ message: string; whatsapp: WhatsAppSendResult } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "warning"; text: string } | null>(null);

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
    const minDelay = new Promise((resolve) => setTimeout(resolve, 2000));
    const [res] = await Promise.all([fetch("/api/reports/monthly/send", { method: "POST" }), minDelay]);
    const data = await res.json();
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setLastSend({ message: data.message, whatsapp: data.whatsapp ?? null });

    if (data.whatsapp?.reason === "not_configured") {
      setToast({ type: "warning", text: "⚠️ WhatsApp não conectado. O relatório foi gerado mas não enviado." });
    } else {
      setToast({ type: "success", text: "✅ Relatório enviado com sucesso!" });
    }
    setTimeout(() => setToast(null), 4000);
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
          <Button size="sm" variant="secondary" onClick={sendMonthlyReport} disabled={sending}>
            {sending ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Send size={14} className="mr-1" />}
            {sent ? "Enviado ✅" : sending ? "Enviando..." : "Enviar agora"}
          </Button>
        </div>
        <pre className="whitespace-pre-wrap rounded-lg bg-background p-3 text-sm text-foreground/80">{monthlyMessage}</pre>

        {lastSend && (
          <div
            className={`mt-3 rounded-lg border p-3 text-sm ${
              lastSend.whatsapp?.reason === "not_configured" ? "border-risk-mid/30 bg-risk-mid/10" : "border-zap/30 bg-zap/10"
            }`}
          >
            <p className="mb-2 font-semibold">📊 RELATÓRIO ENVIADO</p>
            <pre className="mb-2 whitespace-pre-wrap text-foreground/80">{lastSend.message}</pre>
            {lastSend.whatsapp?.reason === "not_configured" ? (
              <p className="flex items-start gap-1.5 text-risk-mid">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                WhatsApp não conectado. O relatório foi gerado mas não enviado. Conecte o WhatsApp nas Configurações para receber os relatórios.
              </p>
            ) : (
              <p className="text-zap-light">
                Status: ✅ Enviado para WhatsApp
                {lastSend.whatsapp?.reason === "mock_mode" && " (em teste: não foi enviado de verdade)"}
              </p>
            )}
          </div>
        )}
      </Card>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-2xl ${
            toast.type === "warning" ? "border-risk-mid/30 bg-surface text-risk-mid" : "border-zap/30 bg-surface text-zap-light"
          }`}
        >
          {toast.type === "warning" ? <AlertTriangle size={16} /> : <Check size={16} />}
          {toast.text}
        </div>
      )}
    </div>
  );
}
