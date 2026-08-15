"use client";

/**
 * Perfil completo do cliente — o "Prontuário Inteligente" visto pelo dono.
 * Histórico de agendamentos, preferências calculadas, alergias, notas e
 * risco de falta.
 */
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Star, Calendar, Phone, Link2, Copy, Check, Brain, MessageCircle, StickyNote } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

const TAG_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  vip: "info",
  fiel: "success",
  novo: "default",
  sumido: "warning",
  problema: "danger",
};

const DIA_LABEL: Record<string, string> = {
  mon: "Segunda",
  tue: "Terça",
  wed: "Quarta",
  thu: "Quinta",
  fri: "Sexta",
  sat: "Sábado",
  sun: "Domingo",
};

const PERIODO_LABEL: Record<string, string> = { manha: "Manhã", tarde: "Tarde", noite: "Noite" };

const STATUS_RETORNO_LABEL: Record<string, { label: string; className: string }> = {
  PONTUAL: { label: "Pontual", className: "text-risk-low" },
  ATRASADO: { label: "ATRASADO", className: "text-risk-mid" },
  MUITO_ATRASADO: { label: "MUITO ATRASADO", className: "text-risk-high" },
};

export function ClientProfile({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<any>(null);
  const [prontuario, setProntuario] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendingReturn, setSendingReturn] = useState(false);
  const [returnSent, setReturnSent] = useState(false);

  useEffect(() => {
    fetch(`/api/clients/${clientId}`).then((r) => r.json()).then(setClient);
    fetch(`/api/clients/${clientId}/prontuario`).then((r) => r.json()).then(setProntuario);
    fetch(`/api/clients/${clientId}/notes`).then((r) => r.json()).then(setNotes);
  }, [clientId]);

  async function generateBookingLink() {
    setGenerating(true);
    const res = await fetch("/api/booking-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    const data = await res.json();
    setBookingUrl(data.url);
    setGenerating(false);
  }

  async function copyLink() {
    if (!bookingUrl) return;
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendReturnMessage() {
    setSendingReturn(true);
    await fetch(`/api/clients/${clientId}/send-return-message`, { method: "POST" });
    setSendingReturn(false);
    setReturnSent(true);
  }

  async function addNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    const res = await fetch(`/api/clients/${clientId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: noteText.trim() }),
    });
    const note = await res.json();
    setNotes((prev) => [note, ...prev]);
    setNoteText("");
    setSavingNote(false);
  }

  if (!client) return <p className="text-sm text-foreground/40">Carregando perfil...</p>;

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Clientes", href: "/dashboard/clients" },
          { label: client.name },
        ]}
      />
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

        <div className="mt-4 border-t border-surface-border pt-4">
          {bookingUrl ? (
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-background px-3 py-2 text-xs text-foreground/70">{bookingUrl}</code>
              <Button size="sm" variant="secondary" onClick={copyLink}>
                {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={generateBookingLink} disabled={generating}>
              <Link2 size={14} className="mr-1" />
              {generating ? "Gerando..." : "Gerar link de agendamento"}
            </Button>
          )}
          <p className="mt-1.5 text-xs text-foreground/40">Link pessoal, válido por 24h, com agendamento e pagamento.</p>
        </div>
      </Card>

      {client.alergias?.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-risk-mid/30 bg-risk-mid/10 p-3 text-sm text-risk-mid">
          <AlertTriangle size={16} />
          Alergias registradas: {client.alergias.join(", ")}
        </div>
      )}

      {/* Prontuário Inteligente */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-1.5"><Brain size={15} /> Prontuário Inteligente</CardTitle></CardHeader>
        {!prontuario ? (
          <p className="text-sm text-foreground/40">Carregando...</p>
        ) : !prontuario.serviceFavorito ? (
          <p className="text-sm text-foreground/40">
            Ainda não há agendamentos concluídos suficientes pra calcular preferências.
          </p>
        ) : (
          <div className="space-y-4 text-sm">
            <div>
              <p className="mb-1.5 font-medium text-foreground/80">Preferências</p>
              <ul className="space-y-1 text-foreground/60">
                {prontuario.professionalPreferido && <li>• Profissional: {prontuario.professionalPreferido.name}</li>}
                {prontuario.serviceFavorito && <li>• Serviço favorito: {prontuario.serviceFavorito.name}</li>}
                {prontuario.diasPreferidos?.length > 0 && (
                  <li>• Dias preferidos: {prontuario.diasPreferidos.map((d: string) => DIA_LABEL[d] ?? d).join(" e ")}</li>
                )}
                {prontuario.periodoPreferido && <li>• Período: {PERIODO_LABEL[prontuario.periodoPreferido]}</li>}
              </ul>
            </div>

            {prontuario.proximoRetorno && (
              <div>
                <p className="mb-1.5 font-medium text-foreground/80">Próximo retorno previsto</p>
                <ul className="space-y-1 text-foreground/60">
                  <li>• Intervalo médio: a cada {prontuario.intervaloMedioDias} dias</li>
                  <li>• Previsto para: {format(new Date(prontuario.proximoRetorno), "dd/MM/yyyy", { locale: ptBR })}</li>
                  <li className={STATUS_RETORNO_LABEL[prontuario.statusRetorno]?.className}>
                    • Status: {STATUS_RETORNO_LABEL[prontuario.statusRetorno]?.label}
                    {prontuario.statusRetorno !== "PONTUAL" && ` há ${prontuario.diasAtrasado} dias ⚠️`}
                  </li>
                </ul>

                {prontuario.statusRetorno !== "PONTUAL" && (
                  <Button size="sm" className="mt-3" onClick={sendReturnMessage} disabled={sendingReturn || returnSent}>
                    <MessageCircle size={14} className="mr-1" />
                    {returnSent ? "Mensagem enviada ✅" : sendingReturn ? "Enviando..." : "Enviar mensagem de retorno"}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Preferências (cadastro)</CardTitle></CardHeader>
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

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-1.5"><StickyNote size={15} /> Notas</CardTitle></CardHeader>
        <div className="mb-3 flex gap-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Escreva uma observação sobre esse cliente..."
            rows={2}
            className="min-h-[44px] w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-zap"
          />
        </div>
        <Button size="sm" variant="secondary" onClick={addNote} disabled={savingNote || !noteText.trim()} className="mb-3">
          {savingNote ? "Salvando..." : "Adicionar nota"}
        </Button>
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="rounded-lg bg-background p-3 text-sm">
              <p className="text-foreground/80">{n.text}</p>
              <p className="mt-1 text-xs text-foreground/40">{format(new Date(n.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
          ))}
          {notes.length === 0 && <p className="text-sm text-foreground/40">Nenhuma nota ainda.</p>}
        </div>
      </Card>
    </div>
  );
}
