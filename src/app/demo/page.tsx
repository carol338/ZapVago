import { isSameDay, isToday } from "date-fns";
import { CalendarDays, DollarSign, CalendarCheck, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { DEMO_APPOINTMENTS, DEMO_BUSINESS } from "@/lib/demo-data";

const DIAS_LABEL = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const STATUS_BADGE: Record<string, { emoji: string; label: string; className: string }> = {
  CONFIRMED: { emoji: "✅", label: "Confirmado", className: "bg-risk-low/15 text-risk-low" },
  PENDING_CONFIRMATION: { emoji: "⏳", label: "Pendente", className: "bg-risk-mid/15 text-risk-mid" },
  NO_SHOW: { emoji: "❌", label: "Faltou", className: "bg-risk-high/15 text-risk-high" },
  COMPLETED: { emoji: "✅", label: "Concluído", className: "bg-surface-hover text-foreground/60" },
};

export default function DemoAgendaPage() {
  const byDay: { date: Date; appointments: typeof DEMO_APPOINTMENTS }[] = [];
  const firstMonday = new Date(DEMO_APPOINTMENTS[0].date);
  firstMonday.setDate(firstMonday.getDate() - ((firstMonday.getDay() + 6) % 7));
  firstMonday.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const date = new Date(firstMonday);
    date.setDate(date.getDate() + i);
    const appointments = DEMO_APPOINTMENTS.filter((a) => isSameDay(a.date, date)).sort((a, b) => a.date.getTime() - b.date.getTime());
    byDay.push({ date, appointments });
  }

  const todayAppointments = DEMO_APPOINTMENTS.filter((a) => isToday(a.date));
  const faturamentoHoje = todayAppointments
    .filter((a) => a.status === "COMPLETED" || a.status === "CONFIRMED")
    .reduce((sum, a) => sum + a.service.price, 0);
  const comparecimentos = todayAppointments.filter((a) => a.status === "COMPLETED").length;
  const faltas = DEMO_APPOINTMENTS.filter((a) => a.status === "NO_SHOW").length;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Agenda</h1>
      <p className="mb-4 text-sm text-foreground/50">{DEMO_BUSINESS.name} — dados de demonstração</p>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <p className="flex items-center gap-1.5 text-xs text-foreground/50">
            <DollarSign size={13} /> Faturamento hoje
          </p>
          <p className="mt-1 text-xl font-bold text-zap-light">{formatCurrency(faturamentoHoje)}</p>
        </Card>
        <Card>
          <p className="flex items-center gap-1.5 text-xs text-foreground/50">
            <CalendarDays size={13} /> Agendados hoje
          </p>
          <p className="mt-1 text-xl font-bold">{todayAppointments.length}</p>
        </Card>
        <Card>
          <p className="flex items-center gap-1.5 text-xs text-foreground/50">
            <CalendarCheck size={13} /> Comparecimentos
          </p>
          <p className="mt-1 text-xl font-bold text-risk-low">{comparecimentos}</p>
        </Card>
        <Card>
          <p className="flex items-center gap-1.5 text-xs text-foreground/50">
            <XCircle size={13} /> Faltas (semana)
          </p>
          <p className="mt-1 text-xl font-bold text-risk-high">{faltas}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {byDay.map(({ date, appointments }, i) => (
          <div key={i} className="rounded-xl border border-surface-border bg-surface p-3">
            <p className={`mb-2 text-sm font-semibold ${isToday(date) ? "text-zap-light" : "text-foreground/80"}`}>
              {DIAS_LABEL[i]} <span className="font-normal text-foreground/40">{date.getDate()}/{date.getMonth() + 1}</span>
            </p>
            <div className="space-y-2">
              {appointments.length === 0 && <p className="text-xs text-foreground/30">Sem agendamentos</p>}
              {appointments.map((a) => {
                const badge = STATUS_BADGE[a.status] ?? STATUS_BADGE.CONFIRMED;
                return (
                  <div
                    key={a.id}
                    className="rounded-lg border border-surface-border p-2.5 text-xs"
                    style={{ borderLeftColor: a.professional.color, borderLeftWidth: 3 }}
                  >
                    <p className="font-medium text-foreground">
                      {a.date.getHours().toString().padStart(2, "0")}:{a.date.getMinutes().toString().padStart(2, "0")}
                    </p>
                    <p className="mt-0.5 font-medium">{a.client.name}</p>
                    <p className="text-foreground/50">
                      {a.service.name} · {a.professional.name}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                      <span className={`whitespace-nowrap rounded-full px-1.5 py-0.5 ${badge.className}`}>
                        {badge.emoji} {badge.label}
                      </span>
                      <span className="ml-auto whitespace-nowrap font-semibold text-foreground/70">{formatCurrency(a.service.price)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
