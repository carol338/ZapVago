"use client";

/**
 * Planilha semanal de agendamentos — o painel principal do ZapVago.
 * Grid de dias x horários, com drag-and-drop para remarcar, filtro por
 * profissional, navegação entre semanas e resumo do dia.
 */
import { Fragment, useEffect, useMemo, useState, useCallback } from "react";
import { addDays, addWeeks, subWeeks, startOfWeek, format, isSameDay, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Printer, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { AgendaCell, CellAppointment } from "./AgendaCell";
import { NewAppointmentModal } from "./NewAppointmentModal";
import { AppointmentDetailModal, AppointmentDetail } from "./AppointmentDetailModal";
import { FlashSaleModal } from "@/components/flash-sales/FlashSaleModal";
import { formatCurrency } from "@/lib/utils";

const DIAS_LABEL = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const HORARIOS = Array.from({ length: 22 }, (_, i) => 8 + i * 0.5).filter((h) => h <= 19); // 08:00–19:00, passo 30min

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

  const loadAppointments = useCallback(async () => {
    const params = new URLSearchParams({ date: weekStart.toISOString(), view: "week" });
    if (professionalFilter) params.set("professionalId", professionalFilter);
    const res = await fetch(`/api/appointments?${params}`);
    if (res.ok) setAppointments(await res.json());
  }, [weekStart, professionalFilter]);

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then(setServices);
    fetch("/api/professionals").then((r) => r.json()).then(setProfessionals);
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

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
      price: a.service.price,
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
  const todayAppointments = appointments.filter((a) => isSameDay(new Date(a.date), today));
  const faturamentoHoje = todayAppointments
    .filter((a) => a.status === "COMPLETED" || a.status === "CONFIRMED")
    .reduce((s, a) => s + a.service.price, 0);
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

      {/* Card resumo do dia */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <p className="text-xs text-foreground/50">Faturamento hoje</p>
          <p className="text-xl font-bold text-zap-light">{formatCurrency(faturamentoHoje)}</p>
        </Card>
        <Card>
          <p className="text-xs text-foreground/50">Agendados hoje</p>
          <p className="text-xl font-bold">{todayAppointments.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-foreground/50">Risco de faltas</p>
          <p className="text-xl font-bold text-risk-mid">{altoRiscoHoje}</p>
        </Card>
        <Card>
          <p className="text-xs text-foreground/50">Horários ociosos</p>
          <p className="text-xl font-bold">{Math.max(0, slotsOciosos)}</p>
        </Card>
      </div>

      {/* Grid semanal */}
      <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
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
                {String(Math.floor(hour)).padStart(2, "0")}:{hour % 1 === 0 ? "00" : "30"}
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
