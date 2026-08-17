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
import { addDays, addYears } from "date-fns";
import { parseLocalDate } from "@/lib/utils";

const PUBLICOS = [
  { value: "todos", label: "Todos os clientes" },
  { value: "sumido", label: "Clientes sumidos (30+ dias)" },
  { value: "novo", label: "Clientes novos" },
  { value: "vip", label: "Clientes VIP" },
];

// 1=segunda ... 7=domingo (mesma convenção de FlashSale.daysOfWeek)
const DIAS_SEMANA = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

function todayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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
  const [scheduleMode, setScheduleMode] = useState<"single" | "recurring">("single");
  const [singleDate, setSingleDate] = useState(todayISODate());
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [timeStart, setTimeStart] = useState("10:00");
  const [timeEnd, setTimeEnd] = useState("14:00");
  const [targetClients, setTargetClients] = useState("sumido");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<{ sent: number } | null>(null);

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((i) => i !== id) : [...list, id]);
  }
  function toggleDay(day: number) {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function validate(): string | null {
    if (!name.trim()) return "Informe o nome do feirão.";
    if (!timeStart || !timeEnd) return "Informe o horário de início e término.";
    if (timeEnd <= timeStart) return "O horário de término deve ser depois do início.";
    if (scheduleMode === "single") {
      if (!singleDate) return "Informe a data do feirão.";
    } else {
      if (selectedDays.length === 0) return "Marque pelo menos um dia da semana.";
    }
    return null;
  }

  async function handleActivate() {
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    setLoading(true);

    let startDate: Date, endDate: Date, daysOfWeek: number[];
    if (scheduleMode === "single") {
      const d = parseLocalDate(singleDate);
      startDate = new Date(d);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(d);
      endDate.setHours(23, 59, 59, 999);
      const jsDay = d.getDay(); // 0=domingo..6=sábado
      daysOfWeek = [jsDay === 0 ? 7 : jsDay];
    } else {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = addYears(startDate, 1); // recorrente "indefinidamente" (1 ano de horizonte)
      daysOfWeek = selectedDays;
    }

    const createRes = await fetch("/api/flash-sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        discountPercent,
        serviceIds: selectedServices,
        professionalIds: selectedProfessionals,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        daysOfWeek,
        timeStart,
        timeEnd,
        targetClients: [targetClients],
        message,
      }),
    });
    if (!createRes.ok) {
      const data = await createRes.json().catch(() => ({}));
      setFormError(data.error ?? "Não foi possível criar o feirão.");
      setLoading(false);
      return;
    }
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

          {/* Data e horário */}
          <div className="rounded-lg border border-surface-border p-3">
            <Label>Data e horário</Label>
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                onClick={() => setScheduleMode("single")}
                className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${scheduleMode === "single" ? "border-zap bg-zap/15 text-zap-light" : "border-surface-border text-foreground/60"}`}
              >
                Data única
              </button>
              <button
                type="button"
                onClick={() => setScheduleMode("recurring")}
                className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${scheduleMode === "recurring" ? "border-zap bg-zap/15 text-zap-light" : "border-surface-border text-foreground/60"}`}
              >
                Recorrente (semanal)
              </button>
            </div>

            {scheduleMode === "single" ? (
              <div>
                <Label>Data do feirão</Label>
                <Input type="date" value={singleDate} onChange={(e) => setSingleDate(e.target.value)} />
              </div>
            ) : (
              <div>
                <Label>Dias da semana</Label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map((d) => (
                    <label
                      key={d.value}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${selectedDays.includes(d.value) ? "border-zap bg-zap/15 text-zap-light" : "border-surface-border text-foreground/60"}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(d.value)}
                        onChange={() => toggleDay(d.value)}
                        className="h-3.5 w-3.5 accent-zap"
                      />
                      {d.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-2 flex gap-2">
              <div className="flex-1">
                <Label>Horário de início</Label>
                <Input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
              </div>
              <div className="flex-1">
                <Label>Horário de término</Label>
                <Input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
              </div>
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

          {formError && <p className="text-sm text-risk-high">{formError}</p>}

          <Button onClick={handleActivate} disabled={loading || !name} className="w-full">
            {loading ? "Disparando..." : "Ativar feirão agora"}
          </Button>
        </div>
      )}
    </Modal>
  );
}
