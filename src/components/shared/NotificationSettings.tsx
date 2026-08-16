"use client";

/**
 * Configurações > Notificações — toggles de aviso (WhatsApp/push/ambos) por
 * evento e o botão pra ativar Web Push no navegador (Bloco 3 Parte 5).
 */
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { subscribeToPush, isPushSupported } from "@/lib/push-client";

const EVENTS: { key: string; label: string }[] = [
  { key: "newAppointment", label: "Novo agendamento" },
  { key: "payment", label: "Pagamento recebido" },
  { key: "humanRequested", label: "Cliente pediu humano" },
  { key: "cancellation", label: "Cancelamento" },
  { key: "noShowRisk", label: "Risco de falta" },
  { key: "dailyReport", label: "Resumo diário (18h)" },
  { key: "monthlyReport", label: "Receita do mês (dia 1)" },
  { key: "sentimentAlert", label: "Alerta de sentimento" },
];

export function NotificationSettings() {
  const [notifyOn, setNotifyOn] = useState<Record<string, any> | null>(null);
  const [saved, setSaved] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "asking" | "granted" | "denied" | "unsupported">("idle");

  useEffect(() => {
    fetch("/api/notifications/settings").then((r) => r.json()).then(setNotifyOn);
    if (!isPushSupported()) {
      setPushStatus("unsupported");
    } else if (Notification.permission === "granted") {
      setPushStatus("granted");
    } else if (Notification.permission === "denied") {
      setPushStatus("denied");
    }
  }, []);

  function toggle(key: string) {
    if (!notifyOn) return;
    setNotifyOn({ ...notifyOn, [key]: !(notifyOn[key] ?? true) });
  }

  async function save() {
    if (!notifyOn) return;
    await fetch("/api/notifications/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notifyOn),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function enablePush() {
    setPushStatus("asking");
    try {
      await subscribeToPush();
      setPushStatus("granted");
    } catch {
      setPushStatus(Notification.permission === "denied" ? "denied" : "idle");
    }
  }

  if (!notifyOn) return <p className="text-sm text-foreground/40">Carregando...</p>;

  return (
    <Card>
      <CardHeader><CardTitle>Notificações</CardTitle></CardHeader>

      <div className="mb-4 rounded-lg bg-background p-3">
        {pushStatus === "granted" ? (
          <p className="flex items-center gap-2 text-sm text-zap-light"><Bell size={16} /> Notificações push ativadas nesse navegador.</p>
        ) : pushStatus === "denied" ? (
          <p className="flex items-center gap-2 text-sm text-foreground/50"><BellOff size={16} /> Push bloqueado — libere nas permissões do navegador pra ativar.</p>
        ) : pushStatus === "unsupported" ? (
          <p className="flex items-center gap-2 text-sm text-foreground/50"><BellOff size={16} /> Esse navegador não suporta notificações push.</p>
        ) : (
          <Button size="sm" variant="secondary" onClick={enablePush} disabled={pushStatus === "asking"}>
            <Bell size={14} className="mr-1" /> {pushStatus === "asking" ? "Ativando..." : "Ativar notificações push"}
          </Button>
        )}
      </div>

      <div className="mb-4">
        <p className="mb-1.5 text-sm text-foreground/70">Canal preferido</p>
        <Select value={notifyOn.channel ?? "both"} onChange={(e) => setNotifyOn({ ...notifyOn, channel: e.target.value })} className="max-w-xs">
          <option value="both">WhatsApp + Push</option>
          <option value="whatsapp">Só WhatsApp</option>
          <option value="push">Só Push</option>
        </Select>
      </div>

      <div className="space-y-2">
        {EVENTS.map((ev) => {
          const active = notifyOn[ev.key] ?? true;
          return (
            <div key={ev.key} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggle(ev.key)}
                className={`h-5 w-9 shrink-0 rounded-full transition-colors ${active ? "bg-zap" : "bg-surface-border"}`}
              >
                <div className={`h-4 w-4 rounded-full bg-white transition-transform ${active ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
              <span className="text-sm">{ev.label}</span>
            </div>
          );
        })}
      </div>

      <Button onClick={save} className="mt-4">{saved ? "Salvo!" : "Salvar notificações"}</Button>
    </Card>
  );
}
