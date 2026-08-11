"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}
interface Professional {
  id: string;
  name: string;
}

export function NewAppointmentModal({
  open,
  onClose,
  onCreated,
  services,
  professionals,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  services: Service[];
  professionals: Professional[];
  defaultDate: Date;
}) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id ?? "");
  const [date, setDate] = useState(format(defaultDate, "yyyy-MM-dd'T'HH:mm"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientName, clientPhone, serviceId, professionalId, date, source: "MANUAL" }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao criar agendamento.");
      return;
    }
    onCreated();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo agendamento">
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
          <Label>Serviço</Label>
          <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name} — {s.duration}min</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Profissional</Label>
          <Select value={professionalId} onChange={(e) => setProfessionalId(e.target.value)}>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Data e horário</Label>
          <Input type="datetime-local" required value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {error && <p className="text-sm text-risk-high">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Agendando..." : "Confirmar agendamento"}
        </Button>
      </form>
    </Modal>
  );
}
