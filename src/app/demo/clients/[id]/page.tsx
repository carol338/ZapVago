"use client";

/**
 * "Prontuário" do cliente na demo — versão simplificada e somente-leitura
 * do ClientProfile.tsx real (sem geração de link de agendamento/prêmio,
 * sem envio de mensagem — tudo isso depende de integrações de verdade).
 * O campo de nota é interativo, mas só guarda no estado local.
 */
import { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, Star, Phone, StickyNote, Gift } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DEMO_CLIENTS, DEMO_APPOINTMENTS, DEMO_LOYALTY_RULE, DEMO_SERVICES } from "@/lib/demo-data";

const TAG_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  vip: "info",
  fiel: "success",
  novo: "default",
  sumido: "warning",
  problema: "danger",
};

export default function DemoClientProfilePage({ params }: { params: { id: string } }) {
  const client = DEMO_CLIENTS.find((c) => c.id === params.id);
  const [notes, setNotes] = useState<string[]>(client?.notes ? [client.notes] : []);
  const [noteText, setNoteText] = useState("");

  if (!client) notFound();

  const history = DEMO_APPOINTMENTS.filter((a) => a.client.id === client.id).sort((a, b) => b.date.getTime() - a.date.getTime());
  const rewardService = DEMO_SERVICES.find((s) => s.id === DEMO_LOYALTY_RULE.rewardServiceId);
  const eligible = client.loyaltyPoints >= DEMO_LOYALTY_RULE.visitsRequired;

  function addNote() {
    if (!noteText.trim()) return;
    setNotes((prev) => [noteText, ...prev]);
    setNoteText("");
  }

  return (
    <div>
      <Link href="/demo/clients" className="mb-3 inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground">
        <ArrowLeft size={15} /> Voltar para clientes
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground/60">
            <Phone size={14} /> {client.phone}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {client.tags.map((t) => (
              <Badge key={t} variant={TAG_VARIANT[t] ?? "default"}>{t}</Badge>
            ))}
          </div>
        </div>
        {client.predictedNoShowRisk >= 0.5 && (
          <div className="flex items-center gap-1.5 rounded-lg border border-risk-high/30 bg-risk-high/10 px-3 py-2 text-sm text-risk-high">
            <AlertTriangle size={16} /> Risco de falta: {Math.round(client.predictedNoShowRisk * 100)}%
          </div>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <p className="text-xs text-foreground/50">Visitas</p>
          <p className="mt-1 text-xl font-bold">{client.totalVisits}</p>
        </Card>
        <Card>
          <p className="text-xs text-foreground/50">Gasto total</p>
          <p className="mt-1 text-xl font-bold text-zap-light">{formatCurrency(client.totalSpent)}</p>
        </Card>
        <Card>
          <p className="text-xs text-foreground/50">Última visita</p>
          <p className="mt-1 text-xl font-bold">{client.lastVisitDaysAgo}d atrás</p>
        </Card>
        <Card>
          <p className="text-xs text-foreground/50">Pontos de fidelidade</p>
          <p className="mt-1 text-xl font-bold">{client.loyaltyPoints}</p>
        </Card>
      </div>

      {client.alergias && client.alergias.length > 0 && (
        <Card className="mb-4 border-risk-mid/30 bg-risk-mid/5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-risk-mid">
            <AlertTriangle size={15} /> Alergias / restrições
          </p>
          <p className="mt-1 text-sm text-foreground/70">{client.alergias.join(", ")}</p>
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader><CardTitle className="flex items-center gap-1.5"><Gift size={15} /> Fidelidade</CardTitle></CardHeader>
        {eligible ? (
          <p className="text-sm text-zap-light">
            <Star size={14} className="mr-1 inline" /> Elegível ao prêmio: {rewardService?.name} ({DEMO_LOYALTY_RULE.rewardDiscount}% off) — já bateu as {DEMO_LOYALTY_RULE.visitsRequired} visitas necessárias.
          </p>
        ) : (
          <p className="text-sm text-foreground/60">
            Faltam {DEMO_LOYALTY_RULE.visitsRequired - client.loyaltyPoints} visita(s) pro prêmio de fidelidade ({rewardService?.name}).
          </p>
        )}
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>Histórico de agendamentos</CardTitle></CardHeader>
        <div className="space-y-2">
          {history.length === 0 && <p className="text-sm text-foreground/40">Sem agendamentos nessa semana de exemplo.</p>}
          {history.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-surface-border p-2.5 text-sm">
              <div>
                <p className="font-medium">{a.service.name}</p>
                <p className="text-xs text-foreground/50">
                  {a.date.toLocaleDateString("pt-BR")} às {a.date.getHours().toString().padStart(2, "0")}:{a.date.getMinutes().toString().padStart(2, "0")} · {a.professional.name}
                </p>
              </div>
              <span className="font-semibold text-foreground/70">{formatCurrency(a.service.price)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-1.5"><StickyNote size={15} /> Notas</CardTitle></CardHeader>
        <div className="mb-3 flex gap-2">
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Escreva uma observação sobre esse cliente..."
            className="min-h-[44px] w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-base text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-zap"
          />
          <Button onClick={addNote}>Salvar</Button>
        </div>
        <div className="space-y-2">
          {notes.length === 0 && <p className="text-sm text-foreground/40">Nenhuma nota ainda.</p>}
          {notes.map((n, i) => (
            <p key={i} className="rounded-lg bg-background p-2.5 text-sm text-foreground/80">{n}</p>
          ))}
        </div>
      </Card>
    </div>
  );
}
