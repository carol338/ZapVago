"use client";

import { cn, formatCurrency } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

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

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-risk-low/15 border-risk-low/40",
  PENDING_CONFIRMATION: "bg-risk-mid/15 border-risk-mid/40",
  CANCELLED: "bg-risk-high/10 border-risk-high/30 opacity-60",
  NO_SHOW: "bg-risk-high/15 border-risk-high/40",
  COMPLETED: "bg-surface-hover border-surface-border",
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

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onClick={onClick}
      className={cn(
        "flex h-20 w-full cursor-pointer flex-col justify-between rounded-md border p-1.5 text-left text-xs transition-transform hover:scale-[1.02]",
        STATUS_STYLES[appointment.status]
      )}
      style={{ borderLeftColor: appointment.professionalColor, borderLeftWidth: 3 }}
    >
      <div>
        <p className="truncate font-semibold">{appointment.clientName}</p>
        <p className="truncate text-foreground/60">{appointment.serviceName}</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="truncate text-foreground/50">{appointment.professionalName}</span>
        <span className="flex items-center gap-1 font-medium">
          {highRisk && <AlertTriangle size={11} className="text-risk-mid" />}
          {formatCurrency(appointment.price)}
        </span>
      </div>
    </div>
  );
}
