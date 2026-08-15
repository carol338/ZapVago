"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Lightbulb } from "lucide-react";

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
interface Suggestion {
  type: "combo" | "pair";
  serviceId: string;
  name: string;
  price?: number;
  discountPercent?: number | null;
  economia?: number | null;
  count?: number;
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
  const [matchedClientId, setMatchedClientId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id ?? "");
  const [date, setDate] = useState(format(defaultDate, "yyyy-MM-dd'T'HH:mm"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [suggestionAccepted, setSuggestionAccepted] = useState(false);

  // Reconhece cliente existente pelo telefone (base do upsell automático)
  useEffect(() => {
    const digits = clientPhone.replace(/\D/g, "");
    if (digits.length < 10) {
      setMatchedClientId(null);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/clients?search=${digits}`)
        .then((r) => r.json())
        .then((list) => {
          const match = list.find((c: any) => c.phone === digits);
          setMatchedClientId(match?.id ?? null);
          if (match?.name && !clientName) setClientName(match.name);
        });
    }, 400);
    return () => clearTimeout(t);
  }, [clientPhone]);

  useEffect(() => {
    setSuggestion(null);
    setSuggestionAccepted(false);
    if (!matchedClientId || !serviceId) return;
    fetch(`/api/clients/${matchedClientId}/suggestions?serviceId=${serviceId}`)
      .then((r) => r.json())
      .then((d) => setSuggestion(d.suggestion));
  }, [matchedClientId, serviceId]);

  const effectiveServiceId = suggestionAccepted && suggestion ? suggestion.serviceId : serviceId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientName, clientPhone, serviceId: effectiveServiceId, professionalId, date, source: "MANUAL" }),
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

        {suggestion && !suggestionAccepted && (
          <div className="rounded-lg border border-zap/30 bg-zap/5 p-3 text-sm">
            <p className="mb-1.5 flex items-center gap-1.5 font-medium text-zap-light">
              <Lightbulb size={14} /> Sugestão para {clientName.split(" ")[0] || "o cliente"}
            </p>
            {suggestion.type === "combo" ? (
              <>
                <p className="mb-2 text-foreground/70">
                  Ela(e) costuma fazer esse serviço. Quer adicionar o combo{" "}
                  <span className="font-medium text-foreground">{suggestion.name}</span>
                  {suggestion.price != null && ` (${formatCurrency(suggestion.price)})`}
                  {suggestion.economia ? ` — economiza ${formatCurrency(suggestion.economia)}` : ""}?
                </p>
              </>
            ) : (
              <p className="mb-2 text-foreground/70">
                Ela(e) costuma agendar <span className="font-medium text-foreground">{suggestion.name}</span> junto com esse
                serviço ({suggestion.count}x no histórico). Quer sugerir?
              </p>
            )}
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={suggestionAccepted}
                onChange={(e) => setSuggestionAccepted(e.target.checked)}
                className="h-4 w-4 accent-zap"
                disabled={suggestion.type === "pair"}
              />
              <span className="text-xs text-foreground/60">
                {suggestion.type === "combo" ? "Adicionar combo ao agendamento" : "Considerar na próxima sugestão"}
              </span>
            </label>
          </div>
        )}

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
