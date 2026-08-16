"use client";

/** Modal "Adicionar manualmente" da Lista de Espera (Bloco 3 Parte 1.2). */
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Service {
  id: string;
  name: string;
}

export function AddWaitingListModal({
  open,
  onClose,
  onCreated,
  services,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  services: Service[];
}) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [preferredDate, setPreferredDate] = useState("");
  const [flexibleDates, setFlexibleDates] = useState(true);
  const [preferredPeriod, setPreferredPeriod] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setClientName("");
      setClientPhone("");
      setServiceId(services[0]?.id ?? "");
      setPreferredDate("");
      setFlexibleDates(true);
      setPreferredPeriod("");
      setError("");
    }
  }, [open, services]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/waiting-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName,
        clientPhone,
        serviceId,
        preferredDate: preferredDate || new Date().toISOString(),
        flexibleDates,
        preferredPeriod: preferredPeriod || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao adicionar na lista.");
      return;
    }
    onCreated();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Adicionar na lista de espera">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label>Nome do cliente</Label>
          <Input required value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </div>
        <div>
          <Label>WhatsApp do cliente</Label>
          <Input required placeholder="5511999998888" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
        </div>
        <div>
          <Label>Serviço desejado</Label>
          <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Data preferida</Label>
          <Input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
        </div>
        <div>
          <Label>Período preferido (opcional)</Label>
          <Select value={preferredPeriod} onChange={(e) => setPreferredPeriod(e.target.value)}>
            <option value="">Sem preferência</option>
            <option value="morning">Manhã</option>
            <option value="afternoon">Tarde</option>
            <option value="evening">Noite</option>
          </Select>
        </div>
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={flexibleDates}
            onChange={(e) => setFlexibleDates(e.target.checked)}
            className="h-4 w-4 accent-zap"
          />
          <span className="text-sm text-foreground/70">Aceita qualquer data (não só a preferida)</span>
        </label>
        {error && <p className="text-sm text-risk-high">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Adicionando..." : "Adicionar à lista"}
        </Button>
      </form>
    </Modal>
  );
}
