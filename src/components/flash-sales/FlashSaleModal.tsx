"use client";

/**
 * Modal do Modo Feirão (Diferencial 6) — dono cria oferta relâmpago
 * para preencher horários ociosos. Ao salvar, dispara imediatamente
 * as mensagens para os clientes-alvo via /api/flash-sales/[id]/activate.
 */
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format, addDays } from "date-fns";

const PUBLICOS = [
  { value: "todos", label: "Todos os clientes" },
  { value: "sumido", label: "Clientes sumidos (15+ dias)" },
  { value: "novo", label: "Clientes novos" },
  { value: "vip", label: "Clientes VIP" },
];

export function FlashSaleModal({
  open,
  onClose,
  services,
  professionals,
}: {
  open: boolean;
  onClose: () => void;
  services: { id: string; name: string }[];
  professionals: { id: string; name: string }[];
}) {
  const [name, setName] = useState("");
  const [discountPercent, setDiscountPercent] = useState(20);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const [timeStart, setTimeStart] = useState("10:00");
  const [timeEnd, setTimeEnd] = useState("14:00");
  const [targetClients, setTargetClients] = useState("sumido");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number } | null>(null);

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((i) => i !== id) : [...list, id]);
  }

  async function handleActivate() {
    setLoading(true);
    const createRes = await fetch("/api/flash-sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        discountPercent,
        serviceIds: selectedServices,
        professionalIds: selectedProfessionals,
        startDate: new Date().toISOString(),
        endDate: addDays(new Date(), 1).toISOString(),
        daysOfWeek: [new Date().getDay() || 7],
        timeStart,
        timeEnd,
        targetClients: [targetClients],
        message,
      }),
    });
    const flashSale = await createRes.json();
    const activateRes = await fetch(`/api/flash-sales/${flashSale.id}/activate`, { method: "POST" });
    const activateData = await activateRes.json();
    setResult({ sent: activateData.sent ?? 0 });
    setLoading(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="🔥 Criar Feirão">
      {result ? (
        <div className="space-y-3 text-center">
          <p className="text-lg font-semibold text-zap-light">Feirão disparado!</p>
          <p className="text-sm text-foreground/60">Mensagens enviadas para {result.sent} cliente(s).</p>
          <Button onClick={onClose} className="w-full">Fechar</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <Label>Nome do feirão</Label>
            <Input placeholder="Terça Maluca" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Desconto (%)</Label>
            <Input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} />
          </div>
          <div>
            <Label>Serviços incluídos</Label>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(selectedServices, setSelectedServices, s.id)}
                  className={`rounded-full border px-3 py-1 text-xs ${selectedServices.includes(s.id) ? "border-zap bg-zap/15 text-zap-light" : "border-surface-border text-foreground/60"}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Profissionais participantes</Label>
            <div className="flex flex-wrap gap-2">
              {professionals.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(selectedProfessionals, setSelectedProfessionals, p.id)}
                  className={`rounded-full border px-3 py-1 text-xs ${selectedProfessionals.includes(p.id) ? "border-zap bg-zap/15 text-zap-light" : "border-surface-border text-foreground/60"}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Das</Label>
              <Input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
            </div>
            <div className="flex-1">
              <Label>Até</Label>
              <Input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Público-alvo</Label>
            <div className="flex flex-wrap gap-2">
              {PUBLICOS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setTargetClients(p.value)}
                  className={`rounded-full border px-3 py-1 text-xs ${targetClients === p.value ? "border-zap bg-zap/15 text-zap-light" : "border-surface-border text-foreground/60"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Mensagem personalizada (opcional)</Label>
            <Input placeholder="🔥 Terça Maluca: 20% OFF hoje!" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <Button onClick={handleActivate} disabled={loading || !name} className="w-full">
            {loading ? "Disparando..." : "Ativar feirão agora"}
          </Button>
        </div>
      )}
    </Modal>
  );
}
