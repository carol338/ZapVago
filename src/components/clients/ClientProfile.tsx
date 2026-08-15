"use client";

/**
 * Perfil completo do cliente — o "Prontuário Inteligente" visto pelo dono.
 * Histórico de agendamentos, preferências, alergias e risco de falta.
 */
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Star, Calendar, Phone } from "lucide-react";

const TAG_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  vip: "info",
  fiel: "success",
  novo: "default",
  sumido: "warning",
  problema: "danger",
};

export function ClientProfile({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/clients/${clientId}`).then((r) => r.json()).then(setClient);
  }, [clientId]);

  if (!client) return <p className="text-sm text-foreground/40">Carregando perfil...</p>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{client.name}</h2>
            <p className="flex items-center gap-1.5 text-sm text-foreground/60"><Phone size={14} /> {client.phone}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {client.tags.map((t: string) => <Badge key={t} variant={TAG_VARIANT[t] ?? "default"}>{t}</Badge>)}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold">{client.totalVisits}</p>
              <p className="text-xs text-foreground/50">Visitas</p>
            </div>
            <div>
              <p className="text-lg font-bold">{formatCurrency(client.totalSpent)}</p>
              <p className="text-xs text-foreground/50">Gasto total</p>
            </div>
            <div>
              <p className="text-lg font-bold">{client.loyaltyPoints}</p>
              <p className="text-xs text-foreground/50">Pontos fidelidade</p>
            </div>
          </div>
        </div>
      </Card>

      {client.alergias?.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-risk-mid/30 bg-risk-mid/10 p-3 text-sm text-risk-mid">
          <AlertTriangle size={16} />
          Alergias registradas: {client.alergias.join(", ")}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Preferências</CardTitle></CardHeader>
          <div className="space-y-1 text-sm text-foreground/70">
            <p>Melhores dias: {client.preferencias?.bestDays?.join(", ") ?? "não identificado ainda"}</p>
            <p>Melhores horários: {client.preferencias?.bestTimes?.join(", ") ?? "não identificado ainda"}</p>
            <p>Intervalo médio entre visitas: {client.avgIntervalDays ? `${Math.round(client.avgIntervalDays)} dias` : "—"}</p>
          </div>
        </Card>
        <Card>
          <CardHeader><CardTitle>Previsão de faltas</CardTitle></CardHeader>
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-bold ${client.predictedNoShowRisk >= 0.5 ? "text-risk-high" : "text-risk-low"}`}>
              {Math.round(client.predictedNoShowRisk * 100)}%
            </span>
            <p className="text-sm text-foreground/60">{client.noShowCount} falta(s) em {client.totalVisits} visita(s)</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Histórico de agendamentos</CardTitle></CardHeader>
        <div className="space-y-2">
          {client.appointments?.map((a: any) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background p-3 text-sm">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Calendar size={14} className="shrink-0 text-foreground/40" />
                <span className="shrink-0">{format(new Date(a.date), "dd/MM/yyyy", { locale: ptBR })}</span>
                <span className="text-foreground/50">{a.service.name} com {a.professional.name}</span>
              </div>
              <Badge variant={a.status === "COMPLETED" ? "success" : a.status === "NO_SHOW" ? "danger" : "default"}>{a.status}</Badge>
            </div>
          ))}
          {(!client.appointments || client.appointments.length === 0) && (
            <p className="text-sm text-foreground/40">Sem agendamentos ainda.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
