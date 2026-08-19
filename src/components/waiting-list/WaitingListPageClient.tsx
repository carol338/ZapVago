"use client";

/**
 * Lista de Espera Ativa — Bloco 3 Parte 1.2. Mostra quem está esperando por
 * qual serviço, ordenado por prioridade (VIP primeiro, depois quem espera
 * há mais tempo). Quando um agendamento é cancelado, o primeiro elegível é
 * notificado automaticamente (ver src/lib/waiting-list.ts).
 *
 * Cada entrada mostra o status atual da oferta, e "Eventos Recentes" dá um
 * log do fluxo inteiro (cancelamento → notificação → resposta →
 * agendamento) — dá pra testar sem precisar do WhatsApp real.
 */
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddWaitingListModal } from "@/components/waiting-list/AddWaitingListModal";
import { Plus, Clock, Bell, Trash2, Star, History } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const PERIOD_LABEL: Record<string, string> = { morning: "Manhã", afternoon: "Tarde", evening: "Noite" };

const EVENT_EMOJI: Record<string, string> = {
  cancelled: "🗑️",
  notified: "📤",
  replied_yes: "✅",
  replied_no: "🚫",
  replied_skip: "🙏",
  booked: "📅",
  expired: "⌛",
};

function waitLabel(createdAt: string) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "há 1 dia";
  return `há ${days} dias`;
}

function entryStatus(entry: any): { emoji: string; label: string; className: string } {
  if (entry.resolvedAt && entry.resolution === "booked") {
    return { emoji: "✅", label: "Agendado", className: "bg-risk-low/15 text-risk-low" };
  }
  if (entry.resolvedAt && entry.resolution === "declined") {
    return { emoji: "🚫", label: "Recusou", className: "bg-foreground/10 text-foreground/50" };
  }
  if (entry.notified && entry.notifiedAt) {
    const hora = format(new Date(entry.notifiedAt), "dd/MM HH:mm", { locale: ptBR });
    return { emoji: "📤", label: `Notificado (${hora}) · aguardando resposta`, className: "bg-risk-mid/15 text-risk-mid" };
  }
  if (entry.excludedAppointmentIds?.length > 0) {
    return { emoji: "❌", label: "Expirado — na fila pra próxima vaga", className: "bg-foreground/10 text-foreground/50" };
  }
  return { emoji: "🕐", label: "Aguardando", className: "bg-zap/15 text-zap-light" };
}

export function WaitingListPageClient() {
  const [entries, setEntries] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load(opts: { silent?: boolean } = {}) {
    if (!opts.silent) setLoading(true);
    Promise.all([
      fetch("/api/waiting-list").then((r) => r.json()),
      fetch("/api/waiting-list/events").then((r) => r.json()),
    ]).then(([entriesData, eventsData]) => {
      setEntries(entriesData);
      setEvents(eventsData);
      if (!opts.silent) setLoading(false);
    });
  }

  useEffect(() => {
    load();
    fetch("/api/services").then((r) => r.json()).then(setServices);
    // Sem WebSocket nesse ambiente — poll leve pra refletir cancelamentos
    // feitos em outra tela (ex: agenda) sem precisar recarregar a página.
    const interval = setInterval(() => load({ silent: true }), 10000);
    return () => clearInterval(interval);
  }, []);

  async function notify(id: string) {
    setBusyId(id);
    await fetch(`/api/waiting-list/${id}/notify`, { method: "POST" });
    setBusyId(null);
  }

  async function remove(id: string) {
    setBusyId(id);
    await fetch(`/api/waiting-list/${id}`, { method: "DELETE" });
    setBusyId(null);
    load();
  }

  const activeEntries = entries.filter((e) => !e.resolvedAt);
  const resolvedEntries = entries.filter((e) => e.resolvedAt);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lista de Espera</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} className="mr-1" /> Adicionar manualmente
        </Button>
      </div>
      <p className="mb-4 text-sm text-foreground/60">
        Quando um agendamento é cancelado, a vaga é oferecida automaticamente pro primeiro cliente elegível da fila.
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card className="flex flex-col items-center gap-1 py-8 text-center">
          <Clock className="mb-1 text-foreground/30" size={28} />
          <p className="font-medium">Ninguém na lista de espera</p>
          <p className="max-w-sm text-sm text-foreground/50">
            Clientes entram aqui quando não há horário livre no WhatsApp, ou você pode adicionar manualmente.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {activeEntries.map((entry) => {
            const isVip = entry.client.tags?.includes("vip");
            const st = entryStatus(entry);
            return (
              <Card key={entry.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-semibold">{entry.client.name}</p>
                    {isVip && (
                      <Badge variant="info">
                        <Star size={10} className="mr-0.5 inline fill-current" /> VIP
                      </Badge>
                    )}
                    <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium leading-none", st.className)}>
                      {st.emoji} {st.label}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/60">
                    {entry.service.name} · {entry.flexibleDates ? "qualquer data" : format(new Date(entry.preferredDate), "dd/MM/yyyy", { locale: ptBR })}
                    {entry.preferredPeriod && ` · ${PERIOD_LABEL[entry.preferredPeriod] ?? entry.preferredPeriod}`}
                  </p>
                  <p className="text-xs text-foreground/40">Esperando {waitLabel(entry.createdAt)} · {entry.client.phone}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => notify(entry.id)} disabled={busyId === entry.id}>
                    <Bell size={14} className="mr-1" /> Notificar
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(entry.id)} disabled={busyId === entry.id}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            );
          })}

          {resolvedEntries.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/40">Resolvidos recentemente</p>
              <div className="space-y-2">
                {resolvedEntries.map((entry) => {
                  const st = entryStatus(entry);
                  return (
                    <Card key={entry.id} className="flex flex-wrap items-center justify-between gap-3 opacity-70">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-semibold">{entry.client.name}</p>
                          <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium leading-none", st.className)}>
                            {st.emoji} {st.label}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/60">{entry.service.name}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <Card className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <History size={16} className="text-foreground/50" />
          <h2 className="font-semibold">Eventos Recentes</h2>
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-foreground/40">Nenhum evento ainda.</p>
        ) : (
          <div className="space-y-1.5">
            {events.map((ev) => (
              <p key={ev.id} className="text-sm text-foreground/70">
                <span className="mr-1.5">{EVENT_EMOJI[ev.type] ?? "•"}</span>
                <span className="text-foreground/40">{format(new Date(ev.createdAt), "dd/MM HH:mm", { locale: ptBR })}</span>
                {" — "}
                {ev.message}
              </p>
            ))}
          </div>
        )}
      </Card>

      <AddWaitingListModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={load} services={services} />
    </div>
  );
}
