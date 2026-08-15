"use client";

import { cn, formatCurrency } from "@/lib/utils";

export interface CellAppointment {
  id: string;
  clientName: string;
  serviceName: string;
  professionalName: string;
  professionalColor: string;
  price: number;
  status: "CONFIRMED" | "PENDING_CONFIRMATION" | "CANCELLED" | "NO_SHOW" | "COMPLETED";
  risk: number;
}

export const STATUS_BADGE: Record<string, { emoji: string; label: string; className: string }> = {
  CONFIRMED: { emoji: "✅", label: "Confirmado", className: "bg-risk-low/15 text-risk-low" },
  PENDING_CONFIRMATION: { emoji: "⏳", label: "Pendente", className: "bg-risk-mid/15 text-risk-mid" },
  CANCELLED: { emoji: "❌", label: "Cancelado", className: "bg-risk-high/15 text-risk-high line-through" },
  NO_SHOW: { emoji: "❌", label: "Faltou", className: "bg-risk-high/15 text-risk-high" },
  COMPLETED: { emoji: "✅", label: "Concluído", className: "bg-surface-hover text-foreground/60" },
};

/** Célula da planilha de agenda — vazia (novo agendamento) ou preenchida (detalhes). */
export function AgendaCell({
  appointment,
  onClick,
  draggable,
  onDragStart,
  onDrop,
  onDragOver,
}: {
  appointment: CellAppointment | null;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: () => void;
  onDrop?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
}) {
  if (!appointment) {
    return (
      <button
        onClick={onClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="h-20 w-full rounded-md border border-dashed border-surface-border/60 text-foreground/20 transition-colors hover:border-zap/50 hover:bg-zap/5 hover:text-zap-light"
      >
        +
      </button>
    );
  }

  const highRisk = appointment.risk >= 0.5 && appointment.status !== "COMPLETED" && appointment.status !== "CANCELLED";
  const badge = STATUS_BADGE[appointment.status] ?? STATUS_BADGE.CONFIRMED;
  const color = appointment.professionalColor || "#10B981";

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onClick={onClick}
      className="flex h-20 w-full cursor-pointer flex-col justify-between rounded-md border border-surface-border p-1.5 text-left text-xs transition-transform hover:scale-[1.02]"
      style={{
        borderLeftColor: color,
        borderLeftWidth: 4,
        backgroundColor: highRisk ? "#F9731619" : `${color}1A`,
      }}
    >
      <div>
        <p className="truncate font-semibold">{appointment.clientName}</p>
        <p className="truncate text-foreground/60">{appointment.serviceName}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <span className={cn("rounded px-1 py-0.5 text-[10px] font-medium leading-none", badge.className)}>
          {badge.emoji} {badge.label}
        </span>
        {highRisk && (
          <span className="rounded bg-orange-500/15 px-1 py-0.5 text-[10px] font-medium leading-none text-orange-400">
            ⚠️ {Math.round(appointment.risk * 100)}%
          </span>
        )}
        <span className="ml-auto font-medium">{formatCurrency(appointment.price)}</span>
      </div>
    </div>
  );
}
