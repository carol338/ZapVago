"use client";

/**
 * Planilha semanal de agendamentos — o painel principal do ZapVago.
 * Desktop: grid de dias x horários, com drag-and-drop para remarcar.
 * Mobile: lista vertical de um dia por vez (mais fácil de usar com o polegar).
 */
import { Fragment, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { addDays, addWeeks, subWeeks, startOfWeek, format, isSameDay, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Printer, Zap, Plus, CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AgendaCell, CellAppointment, STATUS_BADGE } from "./AgendaCell";
import { NewAppointmentModal } from "./NewAppointmentModal";
import { AppointmentDetailModal, AppointmentDetail } from "./AppointmentDetailModal";
import { FlashSaleModal } from "@/components/flash-sales/FlashSaleModal";
import { cn, formatCurrency } from "@/lib/utils";

const DIAS_LABEL = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const HORARIOS = Array.from({ length: 22 }, (_, i) => 8 + i * 0.5).filter((h) => h <= 19); // 08:00–19:00, passo 30min

function hourLabel(hour: number) {
  return `${String(Math.floor(hour)).padStart(2, "0")}:${hour % 1 === 0 ? "00" : "30"}`;
}

export function AgendaGrid() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [professionalFilter, setProfessionalFilter] = useState("");
  const [newModalDate, setNewModalDate] = useState<Date | null>(null);
  const [detail, setDetail] = useState<AppointmentDetail | null>(null);
  const [flashSaleOpen, setFlashSaleOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [blinkingIds, setBlinkingIds] = useState<Set<string>>(new Set());
  const knownIds = useRef<Set<string> | null>(null);
  const [mobileDayIndex, setMobileDayIndex] = useState(() => {
    const today = new Date();
    const diff = Math.round((today.setHours(0, 0, 0, 0) - weekStart.setHours(0, 0, 0, 0)) / 86400000);
    return diff >= 0 && diff <= 6 ? diff : 0;
  });

  const loadAppointments = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!opts.silent) setLoading(true);
      const params = new URLSearchParams({ date: weekStart.toISOString(), view: "week" });
      if (professionalFilter) params.set("professionalId", professionalFilter);
      const res = await fetch(`/api/appointments?${params}`);
      if (res.ok) {
        const data = await res.json();

        // Bloco 3 Parte 5.3: detecta agendamentos novos desde a última checagem
        // (chegaram pelo WhatsApp ou pela página pública) e faz a célula piscar.
        const ids = new Set<string>(data.map((a: any) => a.id));
        if (knownIds.current) {
          const newOnes = [...ids].filter((id) => !knownIds.current!.has(id));
          if (newOnes.length > 0) {
            setBlinkingIds((prev) => new Set([...prev, ...newOnes]));
            setTimeout(() => {
              setBlinkingIds((prev) => {
                const next = new Set(prev);
                newOnes.forEach((id) => next.delete(id));
                return next;
              });
            }, 1800);
          }
        }
        knownIds.current = ids;

        setAppointments(data);
      }
      if (!opts.silent) setLoading(false);
    },
    [weekStart, professionalFilter]
  );

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then(setServices);
    fetch("/api/professionals").then((r) => r.json()).then(setProfessionals);
  }, []);

  useEffect(() => {
    knownIds.current = null; // nova semana/filtro: não pisca tudo como "novo"
    loadAppointments();
  }, [loadAppointments]);

  // Poll leve pra pegar agendamentos criados pelo WhatsApp/página pública
  // enquanto o dono está com o painel aberto (não há WebSocket nesse ambiente).
  useEffect(() => {
    const interval = setInterval(() => loadAppointments({ silent: true }), 5000);
    return () => clearInterval(interval);
  }, [loadAppointments]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const mobileDay = days[mobileDayIndex];

  function findAppointment(day: Date, hour: number) {
    return appointments.find((a) => {
      const d = new Date(a.date);
      return isSameDay(d, day) && d.getHours() + d.getMinutes() / 60 === hour;
    });
  }

  function toCell(a: any): CellAppointment {
    return {
      id: a.id,
      clientName: a.client.name,
      serviceName: a.service.name,
      professionalName: a.professional.name,
      professionalColor: a.professional.color,
      price: a.price ?? a.service.price,
      status: a.status,
      risk: a.noShowPredicted,
    };
  }

  async function openDetail(a: any) {
    setDetail({
      id: a.id,
      date: a.date,
      client: a.client,
      service: a.service,
      professional: a.professional,
      status: a.status,
      noShowPredicted: a.noShowPredicted,
      price: a.price,
      loyaltyRewardApplied: a.loyaltyRewardApplied,
    });
  }

  async function handleDrop(day: Date, hour: number) {
    if (!draggedId) return;
    const newDate = setMinutes(setHours(day, Math.floor(hour)), (hour % 1) * 60);
    await fetch(`/api/appointments/${draggedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate.toISOString() }),
    });
    setDraggedId(null);
    loadAppointments();
  }

  // Resumo do dia atual (primeiro dia da semana visível, ou hoje se estiver na semana)
  const today = new Date();
  const todayAppointments = appointments.filter((a) => isSameDay(new Date(a.date), today) && a.status !== "CANCELLED");
  const faturamentoHoje = todayAppointments
    .filter((a) => a.status === "COMPLETED" || a.status === "CONFIRMED")
    .reduce((s, a) => s + (a.price ?? a.service.price), 0);
  const comparecimentosHoje = todayAppointments.filter((a) => a.status === "COMPLETED").length;
  const faltasHoje = todayAppointments.filter((a) => a.status === "NO_SHOW").length;
  const altoRiscoHoje = todayAppointments.filter((a) => a.noShowPredicted >= 0.5).length;
  const slotsOciosos = HORARIOS.length - todayAppointments.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center justify-center gap-2 sm:justify-start">
          <Button variant="secondary" size="sm" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
            <ChevronLeft size={16} />
          </Button>
          <span className="min-w-[160px] text-center text-sm font-medium sm:min-w-[180px]">
            {format(weekStart, "dd/MM", { locale: ptBR })} — {format(addDays(weekStart, 6), "dd/MM/yyyy", { locale: ptBR })}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
            <ChevronRight size={16} />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={professionalFilter} onChange={(e) => setProfessionalFilter(e.target.value)} className="w-full sm:w-44">
            <option value="">Todos os profissionais</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
          <Button variant="secondary" size="sm" className="flex-1 sm:flex-none" onClick={() => window.print()}>
            <Printer size={16} className="mr-1" /> Exportar
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none" onClick={() => setFlashSaleOpen(true)}>
            <Zap size={16} className="mr-1" /> Feirão
          </Button>
        </div>
      </div>

      {/* Cards de resumo do dia */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-surface-border bg-surface p-4">
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      ) : todayAppointments.length === 0 ? (
        <Card className="flex flex-col items-center gap-1 py-8 text-center">
          <CalendarX2 className="mb-1 text-foreground/30" size={28} />
          <p className="font-medium">📅 Nenhum agendamento hoje</p>
          <p className="max-w-sm text-sm text-foreground/50">
            Quando um cliente agendar pelo WhatsApp, aparecerá aqui automaticamente.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card>
            <p className="text-xs text-foreground/50">💰 Faturamento hoje</p>
            <p className="text-xl font-bold text-zap-light">{formatCurrency(faturamentoHoje)}</p>
          </Card>
          <Card>
            <p className="text-xs text-foreground/50">📅 Agendados hoje</p>
            <p className="text-xl font-bold">{todayAppointments.length}</p>
          </Card>
          <Card>
            <p className="text-xs text-foreground/50">✅ Comparecimentos</p>
            <p className="text-xl font-bold text-risk-low">{comparecimentosHoje}</p>
          </Card>
          <Card>
            <p className="text-xs text-foreground/50">❌ Faltas</p>
            <p className="text-xl font-bold text-risk-high">{faltasHoje}</p>
          </Card>
          <Card>
            <p className="text-xs text-foreground/50">⚠️ Riscos</p>
            <p className="text-xl font-bold text-orange-400">{altoRiscoHoje}</p>
          </Card>
          <Card>
            <p className="text-xs text-foreground/50">Horários ociosos</p>
            <p className="text-xl font-bold">{Math.max(0, slotsOciosos)}</p>
          </Card>
        </div>
      )}

      {/* Lista vertical — mobile */}
      <div className="md:hidden">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {days.map((day, i) => (
            <button
              key={i}
              onClick={() => setMobileDayIndex(i)}
              className={cn(
                "flex min-w-[64px] shrink-0 flex-col items-center rounded-lg border px-3 py-2 text-xs transition-colors",
                i === mobileDayIndex
                  ? "border-zap bg-zap/15 text-zap-light"
                  : "border-surface-border text-foreground/60 hover:bg-surface-hover"
              )}
            >
              <span>{DIAS_LABEL[i]}</span>
              <span className={cn("font-semibold", isSameDay(day, today) && i !== mobileDayIndex && "text-zap-light")}>
                {format(day, "dd/MM")}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {HORARIOS.map((hour) => {
              const appt = findAppointment(mobileDay, hour);
              if (!appt) {
                return (
                  <button
                    key={hour}
                    onClick={() => setNewModalDate(setMinutes(setHours(mobileDay, Math.floor(hour)), (hour % 1) * 60))}
                    className="flex min-h-[36px] w-full items-center gap-3 rounded-md px-2 text-left text-xs text-foreground/30 hover:bg-surface-hover"
                  >
                    <span className="w-12 shrink-0 text-foreground/40">{hourLabel(hour)}</span>
                    <span className="h-px flex-1 bg-surface-border" />
                    <span>Livre</span>
                  </button>
                );
              }
              const badge = STATUS_BADGE[appt.status] ?? STATUS_BADGE.CONFIRMED;
              const highRisk = appt.noShowPredicted >= 0.5 && appt.status !== "COMPLETED" && appt.status !== "CANCELLED";
              const color = appt.professional.color || "#10B981";
              return (
                <button
                  key={hour}
                  onClick={() => openDetail(appt)}
                  className={cn(
                    "flex min-h-[44px] w-full items-start gap-3 rounded-lg border border-surface-border p-3 text-left",
                    blinkingIds.has(appt.id) && "new-appointment-blink"
                  )}
                  style={{
                    borderLeftColor: color,
                    borderLeftWidth: 4,
                    backgroundColor: highRisk ? "#F9731619" : `${color}14`,
                  }}
                >
                  <span className="w-12 shrink-0 pt-0.5 text-xs font-medium text-foreground/50">{hourLabel(hour)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{appt.client.name}</p>
                    <p className="truncate text-xs text-foreground/60">
                      {appt.service.name} · {appt.professional.name} · {formatCurrency(appt.price ?? appt.service.price)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium leading-none", badge.className)}>
                        {badge.emoji} {badge.label}
                      </span>
                      {highRisk && (
                        <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-medium leading-none text-orange-400">
                          ⚠️ Risco de falta: {Math.round(appt.noShowPredicted * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Botão flutuante de novo agendamento */}
        <button
          onClick={() => setNewModalDate(setHours(mobileDay, 9))}
          aria-label="Novo agendamento"
          className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-zap text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Plus size={26} />
        </button>
      </div>

      {/* Grid semanal — desktop */}
      <div className="hidden overflow-x-auto rounded-xl border border-surface-border bg-surface md:block">
        <div className="grid min-w-[900px] grid-cols-[60px_repeat(7,1fr)]">
          <div className="sticky left-0 border-b border-r border-surface-border bg-surface p-2" />
          {days.map((day, i) => (
            <div key={i} className="border-b border-r border-surface-border p-2 text-center">
              <p className="text-xs text-foreground/50">{DIAS_LABEL[i]}</p>
              <p className={`text-sm font-semibold ${isSameDay(day, today) ? "text-zap-light" : ""}`}>{format(day, "dd/MM")}</p>
            </div>
          ))}

          {HORARIOS.map((hour) => (
            <Fragment key={hour}>
              <div className="sticky left-0 border-r border-b border-surface-border bg-surface p-1 text-right text-xs text-foreground/40">
                {hourLabel(hour)}
              </div>
              {days.map((day, i) => {
                const appt = findAppointment(day, hour);
                return (
                  <div key={`${hour}-${i}`} className="border-r border-b border-surface-border p-1">
                    <AgendaCell
                      appointment={appt ? toCell(appt) : null}
                      onClick={() =>
                        appt
                          ? openDetail(appt)
                          : setNewModalDate(setMinutes(setHours(day, Math.floor(hour)), (hour % 1) * 60))
                      }
                      draggable={!!appt}
                      onDragStart={() => appt && setDraggedId(appt.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(day, hour)}
                      blinking={!!appt && blinkingIds.has(appt.id)}
                    />
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {newModalDate && (
        <NewAppointmentModal
          open={!!newModalDate}
          onClose={() => setNewModalDate(null)}
          onCreated={loadAppointments}
          services={services}
          professionals={professionals}
          defaultDate={newModalDate}
        />
      )}

      <AppointmentDetailModal open={!!detail} onClose={() => setDetail(null)} appointment={detail} onChanged={loadAppointments} />

      <FlashSaleModal open={flashSaleOpen} onClose={() => setFlashSaleOpen(false)} services={services} professionals={professionals} />
    </div>
  );
}
