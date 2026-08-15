"use client";

/**
 * Wizard de onboarding — 4 etapas (ver spec):
 * 1. Conta já criada no /register — aqui começamos na conexão do WhatsApp
 * 2. Conectar WhatsApp (QR Code simulado)
 * 3. Configurar horários de funcionamento e bloqueios
 * 4. Serviços e profissionais
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CheckCircle2, Circle, Loader2, QrCode, Plus, Trash2 } from "lucide-react";

const DIAS = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

const TEMPLATES_SERVICOS: Record<string, { name: string; duration: number; price: number }[]> = {
  BARBER: [
    { name: "Corte de Cabelo", duration: 30, price: 45 },
    { name: "Barba", duration: 20, price: 30 },
    { name: "Sobrancelha", duration: 15, price: 15 },
  ],
  SALON: [
    { name: "Corte Feminino", duration: 45, price: 80 },
    { name: "Escova", duration: 40, price: 60 },
    { name: "Coloração", duration: 90, price: 180 },
  ],
  AESTHETIC_CLINIC: [
    { name: "Limpeza de Pele", duration: 60, price: 150 },
    { name: "Peeling", duration: 45, price: 200 },
  ],
  MANICURE: [
    { name: "Manicure", duration: 40, price: 35 },
    { name: "Pedicure", duration: 40, price: 40 },
  ],
  DENTAL_CLINIC: [
    { name: "Consulta", duration: 30, price: 150 },
    { name: "Limpeza", duration: 45, price: 120 },
  ],
  TATTOO_STUDIO: [{ name: "Sessão de Tatuagem", duration: 120, price: 300 }],
  PET_SHOP: [
    { name: "Banho", duration: 60, price: 60 },
    { name: "Tosa", duration: 60, price: 70 },
  ],
  OTHER: [],
};

export function OnboardingWizard({ category }: { category: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Etapa 2 — WhatsApp
  const [whatsappStatus, setWhatsappStatus] = useState<"idle" | "connecting" | "connected">("idle");

  // Etapa 3 — Configurações
  const [workingHours, setWorkingHours] = useState<Record<string, { start: string; end: string } | null>>(
    Object.fromEntries(DIAS.map((d) => [d.key, d.key === "sun" ? null : { start: "09:00", end: "19:00" }]))
  );
  const [blockedSlots, setBlockedSlots] = useState<{ day: string; start: string; end: string; label: string }[]>([
    { day: "mon", start: "12:00", end: "13:00", label: "Almoço" },
  ]);
  const [slotDuration, setSlotDuration] = useState(30);
  const [address, setAddress] = useState("");

  // Etapa 4 — Serviços e profissionais
  const [services, setServices] = useState(TEMPLATES_SERVICOS[category] ?? []);
  const [professionals, setProfessionals] = useState<{ name: string; color: string }[]>([{ name: "", color: "#10B981" }]);

  function connectWhatsApp() {
    setWhatsappStatus("connecting");
    setTimeout(() => setWhatsappStatus("connected"), 2500); // simulação do handshake do provedor
  }

  async function finishOnboarding() {
    await fetch("/api/business/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workingHours,
        blockedSlots,
        slotDuration,
        reminderHours: [24, 1],
        autoConfirm: true,
        allowCancel: true,
        cancelDeadlineHours: 4,
        language: "pt-BR",
        timezone: "America/Sao_Paulo",
        address,
      }),
    });

    for (const s of services) {
      if (!s.name) continue;
      await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
    }
    for (const p of professionals) {
      if (!p.name) continue;
      await fetch("/api/professionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
    }

    router.push("/dashboard");
  }

  const steps = ["Conta", "WhatsApp", "Negócio", "Serviços"];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Indicador de progresso */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              {i + 1 < step ? (
                <CheckCircle2 className="text-zap" size={22} />
              ) : i + 1 === step ? (
                <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-zap text-xs font-bold text-zap">{i + 1}</div>
              ) : (
                <Circle className="text-foreground/30" size={22} />
              )}
              <span className="text-xs text-foreground/60">{label}</span>
            </div>
            {i < steps.length - 1 && <div className="h-px w-8 bg-surface-border" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <h2 className="mb-2 text-xl font-bold">Conta criada com sucesso! 🎉</h2>
          <p className="mb-6 text-sm text-foreground/60">
            Agora vamos conectar seu WhatsApp Business para o ZapVago começar a atender seus clientes automaticamente.
          </p>
          <Button onClick={() => setStep(2)} className="w-full">Continuar</Button>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <h2 className="mb-2 text-xl font-bold">Conectar WhatsApp</h2>
          <p className="mb-6 text-sm text-foreground/60">
            1. Abra o WhatsApp no celular do negócio → 2. Toque em Aparelhos Conectados → 3. Aponte a câmera para o QR Code abaixo.
          </p>
          <div className="mb-6 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-surface-border bg-background p-8">
            {whatsappStatus === "connected" ? (
              <>
                <CheckCircle2 className="text-zap" size={48} />
                <p className="font-medium text-zap-light">✅ Conectado!</p>
              </>
            ) : whatsappStatus === "connecting" ? (
              <>
                <Loader2 className="animate-spin text-zap" size={48} />
                <p className="text-sm text-foreground/60">Conectando...</p>
              </>
            ) : (
              <>
                <QrCode size={96} className="text-foreground/40" />
                <p className="text-sm text-foreground/60">Aguardando leitura do QR Code</p>
              </>
            )}
          </div>
          {whatsappStatus !== "connected" ? (
            <Button onClick={connectWhatsApp} disabled={whatsappStatus === "connecting"} className="w-full">
              {whatsappStatus === "connecting" ? "Conectando..." : "Gerar QR Code (simulado)"}
            </Button>
          ) : (
            <Button onClick={() => setStep(3)} className="w-full">Continuar</Button>
          )}
        </Card>
      )}

      {step === 3 && (
        <Card>
          <h2 className="mb-4 text-xl font-bold">Configurar negócio</h2>

          <Label>Horários de funcionamento</Label>
          <div className="mb-4 space-y-2">
            {DIAS.map((d) => (
              <div key={d.key} className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <button
                  type="button"
                  onClick={() =>
                    setWorkingHours((prev) => ({
                      ...prev,
                      [d.key]: prev[d.key] ? null : { start: "09:00", end: "19:00" },
                    }))
                  }
                  className={`h-5 w-9 shrink-0 rounded-full transition-colors ${workingHours[d.key] ? "bg-zap" : "bg-surface-border"}`}
                >
                  <div className={`h-4 w-4 rounded-full bg-white transition-transform ${workingHours[d.key] ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
                <span className="w-16 shrink-0 text-sm sm:w-20">{d.label}</span>
                {workingHours[d.key] && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      className="w-[6.5rem]"
                      value={workingHours[d.key]!.start}
                      onChange={(e) => setWorkingHours((prev) => ({ ...prev, [d.key]: { ...prev[d.key]!, start: e.target.value } }))}
                    />
                    <span className="text-foreground/40">até</span>
                    <Input
                      type="time"
                      className="w-[6.5rem]"
                      value={workingHours[d.key]!.end}
                      onChange={(e) => setWorkingHours((prev) => ({ ...prev, [d.key]: { ...prev[d.key]!, end: e.target.value } }))}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <Label>Bloqueios fixos (ex: almoço)</Label>
          <div className="mb-2 space-y-2">
            {blockedSlots.map((b, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <Input className="w-28" placeholder="Rótulo" value={b.label} onChange={(e) => {
                  const copy = [...blockedSlots]; copy[i].label = e.target.value; setBlockedSlots(copy);
                }} />
                <Input type="time" className="w-24" value={b.start} onChange={(e) => {
                  const copy = [...blockedSlots]; copy[i].start = e.target.value; setBlockedSlots(copy);
                }} />
                <Input type="time" className="w-24" value={b.end} onChange={(e) => {
                  const copy = [...blockedSlots]; copy[i].end = e.target.value; setBlockedSlots(copy);
                }} />
                <button onClick={() => setBlockedSlots(blockedSlots.filter((_, idx) => idx !== i))} className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-foreground/40 transition-colors hover:bg-risk-high/10 hover:text-risk-high">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setBlockedSlots([...blockedSlots, { day: "mon", start: "12:00", end: "13:00", label: "" }])}
              className="flex items-center gap-1 text-sm text-zap-light hover:underline"
            >
              <Plus size={14} /> Adicionar bloqueio
            </button>
          </div>

          <div className="mb-4 mt-4">
            <Label>Duração dos slots</Label>
            <Select value={slotDuration} onChange={(e) => setSlotDuration(Number(e.target.value))}>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>1 hora</option>
            </Select>
          </div>

          <div className="mb-4">
            <Label>Endereço</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade" />
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(2)}>Voltar</Button>
            <Button onClick={() => setStep(4)} className="flex-1">Continuar</Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <h2 className="mb-4 text-xl font-bold">Serviços e profissionais</h2>

          <Label>Serviços</Label>
          <div className="mb-4 space-y-2">
            {services.map((s, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <Input className="min-w-0 flex-1 basis-full sm:basis-auto" placeholder="Nome do serviço" value={s.name} onChange={(e) => {
                  const copy = [...services]; copy[i] = { ...copy[i], name: e.target.value }; setServices(copy);
                }} />
                <Input type="number" className="w-24" placeholder="Min" value={s.duration} onChange={(e) => {
                  const copy = [...services]; copy[i] = { ...copy[i], duration: Number(e.target.value) }; setServices(copy);
                }} />
                <Input type="number" className="w-28" placeholder="R$" value={s.price} onChange={(e) => {
                  const copy = [...services]; copy[i] = { ...copy[i], price: Number(e.target.value) }; setServices(copy);
                }} />
                <button onClick={() => setServices(services.filter((_, idx) => idx !== i))} className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-foreground/40 transition-colors hover:bg-risk-high/10 hover:text-risk-high">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setServices([...services, { name: "", duration: 30, price: 0 }])}
              className="flex items-center gap-1 text-sm text-zap-light hover:underline"
            >
              <Plus size={14} /> Adicionar serviço
            </button>
          </div>

          <Label>Profissionais</Label>
          <div className="mb-6 space-y-2">
            {professionals.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input className="min-w-0 flex-1" placeholder="Nome do profissional" value={p.name} onChange={(e) => {
                  const copy = [...professionals]; copy[i] = { ...copy[i], name: e.target.value }; setProfessionals(copy);
                }} />
                <input type="color" value={p.color} onChange={(e) => {
                  const copy = [...professionals]; copy[i] = { ...copy[i], color: e.target.value }; setProfessionals(copy);
                }} className="h-9 w-9 rounded border border-surface-border bg-background" />
                <button onClick={() => setProfessionals(professionals.filter((_, idx) => idx !== i))} className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-foreground/40 transition-colors hover:bg-risk-high/10 hover:text-risk-high">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setProfessionals([...professionals, { name: "", color: "#3B82F6" }])}
              className="flex items-center gap-1 text-sm text-zap-light hover:underline"
            >
              <Plus size={14} /> Adicionar profissional
            </button>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(3)}>Voltar</Button>
            <Button onClick={finishOnboarding} className="flex-1">Finalizar e ir para o painel</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
