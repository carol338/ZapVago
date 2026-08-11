"use client";

/**
 * Tela de configurações — dados do negócio, horários de funcionamento,
 * política de cancelamento, notificações do dono e gerenciamento de
 * serviços/profissionais.
 */
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DIAS = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

export function BusinessSettings() {
  const [business, setBusiness] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/business").then((r) => r.json()).then((b) => {
      setBusiness(b);
      setSettings(b.settings ?? {});
    });
  }, []);

  async function save() {
    await fetch("/api/business/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!business) return <p className="text-sm text-foreground/40">Carregando...</p>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Dados do negócio</CardTitle></CardHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Nome</Label>
            <Input value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Endereço</Label>
            <Input value={settings.address ?? ""} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Horários de funcionamento</CardTitle></CardHeader>
        <div className="space-y-2">
          {DIAS.map((d) => {
            const hours = settings.workingHours?.[d.key];
            return (
              <div key={d.key} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      workingHours: { ...settings.workingHours, [d.key]: hours ? null : { start: "09:00", end: "19:00" } },
                    })
                  }
                  className={`h-5 w-9 rounded-full transition-colors ${hours ? "bg-zap" : "bg-surface-border"}`}
                >
                  <div className={`h-4 w-4 rounded-full bg-white transition-transform ${hours ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
                <span className="w-20 text-sm">{d.label}</span>
                {hours && (
                  <>
                    <Input type="time" className="w-28" value={hours.start} onChange={(e) =>
                      setSettings({ ...settings, workingHours: { ...settings.workingHours, [d.key]: { ...hours, start: e.target.value } } })
                    } />
                    <Input type="time" className="w-28" value={hours.end} onChange={(e) =>
                      setSettings({ ...settings, workingHours: { ...settings.workingHours, [d.key]: { ...hours, end: e.target.value } } })
                    } />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Política de cancelamento</CardTitle></CardHeader>
        <div className="flex items-center gap-3">
          <Label className="mb-0">Antecedência mínima (horas):</Label>
          <Input
            type="number"
            className="w-24"
            value={settings.cancelDeadlineHours ?? 4}
            onChange={(e) => setSettings({ ...settings, cancelDeadlineHours: Number(e.target.value) })}
          />
        </div>
      </Card>

      <Button onClick={save}>{saved ? "Salvo!" : "Salvar configurações"}</Button>
    </div>
  );
}
