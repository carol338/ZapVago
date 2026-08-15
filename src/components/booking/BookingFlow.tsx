"use client";

/**
 * Fluxo de agendamento com pagamento — a parte interativa da página
 * /{subdomain}/agendar/{token}. Serviço → profissional → horário → combo
 * → pagamento (Pix/Cartão/Local) → confirmação.
 */
import { useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Copy, Loader2, MessageCircle, Star } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  image: string | null;
  description: string | null;
  color: string;
  comboOf: string[];
  comboDiscount: number | null;
}
interface Professional {
  id: string;
  name: string;
  photo: string | null;
  color: string;
  serviceIds: string[];
}
interface Slot {
  time: string;
  professionalId: string;
}

export function BookingFlow({
  token,
  business,
  client,
  preselected,
  services,
  professionals,
}: {
  token: string;
  business: { name: string; slug: string; logo: string | null; colorPrimary: string | null; colorSecondary: string | null; phone: string };
  client: { id: string; name: string; phone: string; preferredProfessionalId: string | null };
  preselected: { serviceId: string | null; professionalId: string | null };
  services: Service[];
  professionals: Professional[];
}) {
  const primary = business.colorPrimary || "#00A884";

  const [serviceId, setServiceId] = useState(preselected.serviceId ?? services[0]?.id ?? "");
  const [comboId, setComboId] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState(preselected.professionalId ?? "");
  const [dateIndex, setDateIndex] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "local">("pix");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pix, setPix] = useState<{ appointmentId: string; qrCodeText: string; expiresAt: string } | null>(null);
  const [pixSecondsLeft, setPixSecondsLeft] = useState(0);
  const [pixExpired, setPixExpired] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState<{ serviceName: string; professionalName: string; date: Date; paymentLabel: string } | null>(
    null
  );

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(new Date(), i + 1)), []);
  const selectedDate = days[dateIndex];

  const combos = useMemo(() => services.filter((s) => s.comboOf.includes(serviceId) && s.id !== serviceId), [services, serviceId]);
  const effectiveService = useMemo(
    () => services.find((s) => s.id === (comboId ?? serviceId)) ?? services[0],
    [services, serviceId, comboId]
  );
  const eligibleProfessionals = useMemo(
    () => professionals.filter((p) => p.serviceIds.includes(effectiveService?.id ?? "")),
    [professionals, effectiveService]
  );

  useEffect(() => {
    if (professionalId && !eligibleProfessionals.some((p) => p.id === professionalId)) {
      setProfessionalId("");
    }
  }, [eligibleProfessionals, professionalId]);

  useEffect(() => {
    if (!effectiveService) return;
    setLoadingSlots(true);
    setTime(null);
    const params = new URLSearchParams({
      token,
      serviceId: effectiveService.id,
      date: format(selectedDate, "yyyy-MM-dd"),
    });
    if (professionalId) params.set("professionalId", professionalId);
    fetch(`/api/public/availability?${params}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .finally(() => setLoadingSlots(false));
  }, [token, effectiveService, professionalId, selectedDate]);

  useEffect(() => {
    if (!pix || confirmed) return;
    const tick = () => {
      const secs = Math.max(0, Math.floor((new Date(pix.expiresAt).getTime() - Date.now()) / 1000));
      setPixSecondsLeft(secs);
      if (secs === 0) setPixExpired(true);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pix, confirmed]);

  const manha = slots.filter((s) => Number(s.time.split(":")[0]) < 12);
  const tarde = slots.filter((s) => Number(s.time.split(":")[0]) >= 12);

  const price = effectiveService?.price ?? 0;
  const pixPrice = Math.round(price * 0.95 * 100) / 100;

  async function handleConfirm() {
    if (!effectiveService || !professionalId || !time) return;
    setSubmitting(true);
    setError(null);
    try {
      const createRes = await fetch("/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          serviceId: effectiveService.id,
          professionalId,
          date: format(selectedDate, "yyyy-MM-dd"),
          time,
          paymentMethod,
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created.error ?? "Não foi possível criar o agendamento.");

      const professional = professionals.find((p) => p.id === professionalId)!;
      const [h, m] = time.split(":").map(Number);
      const finalDate = new Date(selectedDate);
      finalDate.setHours(h, m, 0, 0);

      if (paymentMethod === "local") {
        setConfirmed({ serviceName: effectiveService.name, professionalName: professional.name, date: finalDate, paymentLabel: "A pagar no local" });
      } else if (paymentMethod === "card") {
        const cardRes = await fetch("/api/public/payments/card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId: created.appointmentId, token, installments: 3 }),
        });
        const cardData = await cardRes.json();
        if (!cardRes.ok) throw new Error("Pagamento no cartão recusado.");
        setConfirmed({ serviceName: effectiveService.name, professionalName: professional.name, date: finalDate, paymentLabel: "Cartão ✅" });
      } else {
        const pixRes = await fetch("/api/public/payments/pix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId: created.appointmentId, token }),
        });
        const pixData = await pixRes.json();
        if (!pixRes.ok) throw new Error("Não foi possível gerar o Pix.");
        setPix({ appointmentId: created.appointmentId, qrCodeText: pixData.qrCodeText, expiresAt: pixData.expiresAt });
      }
    } catch (e: any) {
      setError(e.message ?? "Algo deu errado. Tenta de novo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSimulatePixPaid() {
    if (!pix) return;
    setConfirming(true);
    const res = await fetch("/api/public/webhooks/mercadopago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: pix.appointmentId }),
    });
    setConfirming(false);
    if (!res.ok) return;

    const professional = professionals.find((p) => p.id === professionalId)!;
    const [h, m] = (time ?? "00:00").split(":").map(Number);
    const finalDate = new Date(selectedDate);
    finalDate.setHours(h, m, 0, 0);
    setConfirmed({ serviceName: effectiveService!.name, professionalName: professional.name, date: finalDate, paymentLabel: "Pix ✅" });
  }

  const canConfirm = !!effectiveService && !!professionalId && !!time && !submitting;

  const style = { ["--pub-primary" as any]: primary };

  // Tela de confirmação
  if (confirmed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0B] p-6 text-[#FAFAFA]" style={style}>
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${primary}26` }}
          >
            <Check size={32} style={{ color: "var(--pub-primary)" }} />
          </div>
          <h1 className="mb-1 text-xl font-bold">AGENDADO!</h1>
          <p className="font-medium">
            {confirmed.serviceName} com {confirmed.professionalName}
          </p>
          <p className="text-sm text-white/60">{format(confirmed.date, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}</p>
          <p className="mt-1 text-sm text-white/60">Pagamento: {confirmed.paymentLabel}</p>
          <p className="mt-4 text-xs text-white/40">Você vai receber a confirmação no WhatsApp com todos os detalhes.</p>
          <a
            href={`https://wa.me/${business.phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex min-h-[48px] items-center justify-center gap-2 rounded-lg font-medium text-white"
            style={{ backgroundColor: "var(--pub-primary)" }}
          >
            <MessageCircle size={18} /> Voltar para o WhatsApp
          </a>
        </div>
      </div>
    );
  }

  // Tela de Pix (aguardando pagamento)
  if (pix) {
    const minutes = String(Math.floor(pixSecondsLeft / 60)).padStart(2, "0");
    const seconds = String(pixSecondsLeft % 60).padStart(2, "0");
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0B] p-6 text-[#FAFAFA]" style={style}>
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <h1 className="mb-1 text-lg font-bold">Pague com Pix</h1>
          <p className="mb-4 text-2xl font-bold" style={{ color: "var(--pub-primary)" }}>
            {formatCurrency(pixPrice)}
          </p>

          {pixExpired ? (
            <div className="rounded-lg bg-white/5 p-4 text-sm text-white/60">
              ⏰ O tempo pra pagar esse Pix acabou e o horário foi liberado. Volte e tente agendar de novo.
            </div>
          ) : (
            <>
              <div className="mb-3 rounded-lg border border-white/10 bg-black/30 p-3 text-left">
                <p className="mb-1 text-[10px] uppercase text-white/40">Código copia e cola</p>
                <p className="break-all font-mono text-xs text-white/70">{pix.qrCodeText}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(pix.qrCodeText)}
                className="mb-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-white/10 text-sm font-medium hover:bg-white/5"
              >
                <Copy size={15} /> Copiar código
              </button>
              <p className="mb-4 text-sm text-white/50">
                Expira em <span className="font-mono font-medium text-white/80">{minutes}:{seconds}</span>
              </p>
              <button
                onClick={handleSimulatePixPaid}
                disabled={confirming}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: "var(--pub-primary)" }}
              >
                {confirming ? <Loader2 size={18} className="animate-spin" /> : "Já paguei"}
              </button>
              <p className="mt-2 text-[11px] text-white/30">
                (Modo de teste: não há integração real do Mercado Pago ainda — esse botão simula a confirmação do pagamento.)
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Formulário principal
  return (
    <div className="min-h-screen bg-[#0A0A0B] pb-8 text-[#FAFAFA]" style={style}>
      <header className="border-b border-white/10 px-4 py-5 text-center">
        {business.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={business.logo} alt={business.name} className="mx-auto mb-2 h-12 w-12 rounded-xl object-cover" />
        ) : (
          <div
            className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: "var(--pub-primary)" }}
          >
            {business.name[0]}
          </div>
        )}
        <p className="font-semibold">{business.name}</p>
        <p className="mt-1 text-sm text-white/60">Olá, {client.name.split(" ")[0]}! 👋</p>
      </header>

      <div className="mx-auto max-w-md space-y-6 px-4 py-6">
        {/* Serviço */}
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Serviço</h2>
          <div className="space-y-2">
            {services
              .filter((s) => s.comboOf.length === 0) // combos aparecem como opção dentro do serviço base
              .map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setServiceId(s.id);
                    setComboId(null);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors",
                    serviceId === s.id && !comboId ? "border-white/30 bg-white/[0.06]" : "border-white/10 hover:bg-white/[0.03]"
                  )}
                >
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-white/50">{s.duration} min</p>
                  </div>
                  <span className="font-semibold" style={{ color: "var(--pub-primary)" }}>
                    {formatCurrency(s.price)}
                  </span>
                </button>
              ))}
          </div>
        </section>

        {/* Combos */}
        {combos.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Combos (economize)</h2>
            <div className="space-y-2">
              {combos.map((c) => {
                const checked = comboId === c.id;
                return (
                  <label
                    key={c.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                      checked ? "border-white/30 bg-white/[0.06]" : "border-white/10 hover:bg-white/[0.03]"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setComboId(e.target.checked ? c.id : null)}
                      className="h-5 w-5 shrink-0 accent-[var(--pub-primary)]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-white/50">
                        {formatCurrency(c.price)}
                        {c.comboDiscount ? ` · economiza ${c.comboDiscount}%` : ""}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>
        )}

        {/* Profissional */}
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Profissional</h2>
          <div className="grid grid-cols-2 gap-2">
            {eligibleProfessionals.map((p) => {
              const isPreferred = p.id === client.preferredProfessionalId;
              const selected = professionalId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setProfessionalId(p.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors",
                    selected ? "border-white/30 bg-white/[0.06]" : "border-white/10 hover:bg-white/[0.03]"
                  )}
                >
                  {p.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo} alt={p.name} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.name[0]}
                    </div>
                  )}
                  <span className="text-sm font-medium">{p.name}</span>
                  {isPreferred && (
                    <span className="flex items-center gap-1 text-[10px] text-white/40">
                      <Star size={10} className="fill-current" /> sua preferida
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Horário */}
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Horário</h2>
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {days.map((d, i) => (
              <button
                key={i}
                onClick={() => setDateIndex(i)}
                className={cn(
                  "flex min-w-[56px] shrink-0 flex-col items-center rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                  i === dateIndex ? "border-white/30 bg-white/[0.06]" : "border-white/10 text-white/60 hover:bg-white/[0.03]"
                )}
              >
                <span>{format(d, "EEE", { locale: ptBR })}</span>
                <span className="font-semibold">{format(d, "dd/MM")}</span>
              </button>
            ))}
          </div>

          {!professionalId ? (
            <p className="text-sm text-white/40">Escolha um profissional pra ver os horários.</p>
          ) : loadingSlots ? (
            <p className="text-sm text-white/40">Carregando horários...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-white/40">Sem horários livres nesse dia. Tenta outra data.</p>
          ) : (
            <div className="space-y-3">
              {manha.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs text-white/40">Manhã</p>
                  <div className="flex flex-wrap gap-2">
                    {manha.map((s) => (
                      <TimeButton key={s.time} slot={s} selected={time === s.time} onSelect={() => { setTime(s.time); setProfessionalId(s.professionalId); }} primary={primary} />
                    ))}
                  </div>
                </div>
              )}
              {tarde.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs text-white/40">Tarde</p>
                  <div className="flex flex-wrap gap-2">
                    {tarde.map((s) => (
                      <TimeButton key={s.time} slot={s} selected={time === s.time} onSelect={() => { setTime(s.time); setProfessionalId(s.professionalId); }} primary={primary} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Pagamento */}
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Pagamento</h2>
          <div className="space-y-2">
            <PaymentOption
              active={paymentMethod === "pix"}
              onSelect={() => setPaymentMethod("pix")}
              label="Pix (5% off)"
              value={formatCurrency(pixPrice)}
              primary={primary}
            />
            <PaymentOption
              active={paymentMethod === "card"}
              onSelect={() => setPaymentMethod("card")}
              label="Cartão em até 3x"
              value={formatCurrency(price)}
              primary={primary}
            />
            <PaymentOption
              active={paymentMethod === "local"}
              onSelect={() => setPaymentMethod("local")}
              label="Pagar no local"
              value={formatCurrency(price)}
              primary={primary}
            />
          </div>
        </section>

        {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}

        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg font-semibold text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: "var(--pub-primary)" }}
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : "CONFIRMAR AGENDAMENTO"}
        </button>

        <p className="text-center text-xs text-white/30">
          ⚡ Se pagar agora e precisar remarcar, é grátis até 4h antes.
        </p>
      </div>
    </div>
  );
}

function TimeButton({ slot, selected, onSelect, primary }: { slot: Slot; selected: boolean; onSelect: () => void; primary: string }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "min-h-[44px] min-w-[64px] rounded-lg border px-3 text-sm font-medium transition-colors",
        selected ? "border-transparent text-white" : "border-white/10 text-white/70 hover:bg-white/[0.05]"
      )}
      style={selected ? { backgroundColor: primary } : undefined}
    >
      {slot.time}
    </button>
  );
}

function PaymentOption({
  active,
  onSelect,
  label,
  value,
  primary,
}: {
  active: boolean;
  onSelect: () => void;
  label: string;
  value: string;
  primary: string;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex min-h-[44px] w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left transition-colors",
        active ? "border-white/30 bg-white/[0.06]" : "border-white/10 hover:bg-white/[0.03]"
      )}
    >
      <span className="flex items-center gap-2 font-medium">
        <span
          className="flex h-4 w-4 items-center justify-center rounded-full border-2"
          style={{ borderColor: active ? primary : "rgba(255,255,255,0.3)" }}
        >
          {active && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: primary }} />}
        </span>
        {label}
      </span>
      <span className="font-semibold" style={{ color: "var(--pub-primary)" }}>
        {value}
      </span>
    </button>
  );
}
