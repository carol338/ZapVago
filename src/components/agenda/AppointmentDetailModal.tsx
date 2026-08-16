"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Phone } from "lucide-react";

// Mesmo valor de CRITICAL_RISK_THRESHOLD em src/lib/noshow.ts — duplicado aqui
// pra não importar código server-only (prisma, whatsapp) num client component.
const CRITICAL_RISK_THRESHOLD = 0.7;

export interface AppointmentDetail {
  id: string;
  date: string;
  client: { name: string; phone: string; alergias: string[] };
  service: { name: string; price: number };
  professional: { name: string };
  status: string;
  noShowPredicted: number;
  price?: number | null;
  loyaltyRewardApplied?: boolean;
}

const STATUS_LABEL: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" }> = {
  CONFIRMED: { label: "Confirmado", variant: "success" },
  PENDING_CONFIRMATION: { label: "Aguardando confirmação", variant: "warning" },
  CANCELLED: { label: "Cancelado", variant: "danger" },
  NO_SHOW: { label: "Não compareceu", variant: "danger" },
  COMPLETED: { label: "Concluído", variant: "default" },
};

export function AppointmentDetailModal({
  open,
  onClose,
  appointment,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  appointment: AppointmentDetail | null;
  onChanged: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  if (!appointment) return null;

  async function act(action: "confirm" | "no-show" | "complete" | "cancel") {
    setLoading(action);
    const url = action === "cancel" ? `/api/appointments/${appointment!.id}` : `/api/appointments/${appointment!.id}/${action}`;
    await fetch(url, { method: action === "cancel" ? "DELETE" : "PUT" });
    setLoading(null);
    onChanged();
    onClose();
  }

  async function sendConfirmation() {
    setLoading("send-confirmation");
    await fetch(`/api/appointments/${appointment!.id}/send-confirmation`, { method: "POST" });
    setLoading(null);
    setConfirmationSent(true);
  }

  const status = STATUS_LABEL[appointment.status] ?? STATUS_LABEL.CONFIRMED;

  return (
    <Modal open={open} onClose={onClose} title="Detalhes do agendamento">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{appointment.client.name}</h3>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-foreground/60">
          <Phone size={14} /> {appointment.client.phone}
        </p>
        <div className="rounded-lg bg-background p-3 text-sm">
          <p>
            <span className="text-foreground/50">Serviço:</span> {appointment.service.name} — {formatCurrency(appointment.price ?? appointment.service.price)}
            {appointment.loyaltyRewardApplied && <span className="ml-1 text-zap-light">🎁 prêmio de fidelidade</span>}
          </p>
          <p><span className="text-foreground/50">Profissional:</span> {appointment.professional.name}</p>
          <p><span className="text-foreground/50">Data:</span> {format(new Date(appointment.date), "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>

        {appointment.client.alergias?.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-risk-mid/30 bg-risk-mid/10 p-3 text-sm text-risk-mid">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>Alergias registradas: {appointment.client.alergias.join(", ")}</span>
          </div>
        )}

        {appointment.noShowPredicted >= 0.5 && (
          <div className="space-y-2 rounded-lg border border-risk-high/30 bg-risk-high/10 p-3 text-sm text-risk-high">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>Risco de falta previsto: {Math.round(appointment.noShowPredicted * 100)}%</span>
            </div>
            {appointment.noShowPredicted >= CRITICAL_RISK_THRESHOLD && (
              <Button
                size="sm"
                variant="secondary"
                onClick={sendConfirmation}
                disabled={!!loading || confirmationSent}
                className="w-full"
              >
                {confirmationSent ? "Confirmação enviada ✅" : loading === "send-confirmation" ? "Enviando..." : "Enviar confirmação extra"}
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" onClick={() => act("confirm")} disabled={!!loading}>Confirmar</Button>
          <Button size="sm" variant="secondary" onClick={() => act("complete")} disabled={!!loading}>Concluir</Button>
          <Button size="sm" variant="secondary" onClick={() => act("no-show")} disabled={!!loading}>Marcar falta</Button>
          <Button size="sm" variant="danger" onClick={() => act("cancel")} disabled={!!loading}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  );
}
