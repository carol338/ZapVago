"use client";

/**
 * Lista de Espera Ativa — Bloco 3 Parte 1.2. Mostra quem está esperando por
 * qual serviço, ordenado por prioridade (VIP primeiro, depois quem espera
 * há mais tempo). Quando um agendamento é cancelado, o primeiro elegível é
 * notificado automaticamente (ver src/lib/waiting-list.ts).
 */
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { AddWaitingListModal } from "@/components/waiting-list/AddWaitingListModal";
import { Plus, Clock, Bell, Trash2, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PERIOD_LABEL: Record<string, string> = { morning: "Manhã", afternoon: "Tarde", evening: "Noite" };

function waitLabel(createdAt: string) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "há 1 dia";
  return `há ${days} dias`;
}

export default function WaitingListPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/waiting-list")
      .then((r) => r.json())
      .then((data) => {
        setEntries(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
    fetch("/api/services").then((r) => r.json()).then(setServices);
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

  return (
    <div>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Lista de Espera" }]} />
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
          {entries.map((entry) => {
            const isVip = entry.client.tags?.includes("vip");
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
                    {entry.notified && <Badge variant="warning">Oferta enviada</Badge>}
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
        </div>
      )}

      <AddWaitingListModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={load} services={services} />
    </div>
  );
}
