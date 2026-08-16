/**
 * Central de notificações do dono — Bloco 3 Parte 5. Todo aviso proativo pro
 * dono (novo agendamento, pagamento, cliente pediu humano, cancelamento,
 * risco de falta, relatórios) passa por aqui, respeitando os toggles de
 * Configurações > Notificações (Owner.notifyOn) e o canal escolhido
 * (WhatsApp, push do navegador, ou ambos — "both" é o padrão).
 */
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { sendPushToBusiness } from "@/lib/push";

export type NotifyEvent =
  | "newAppointment"
  | "payment"
  | "humanRequested"
  | "cancellation"
  | "noShowRisk"
  | "dailyReport"
  | "monthlyReport"
  | "sentimentAlert";

const EVENT_TITLES: Record<NotifyEvent, string> = {
  newAppointment: "🔔 Novo agendamento",
  payment: "💰 Pagamento recebido",
  humanRequested: "🙋 Cliente pediu atendimento humano",
  cancellation: "❌ Agendamento cancelado",
  noShowRisk: "⚠️ Risco de falta",
  dailyReport: "📋 Resumo diário",
  monthlyReport: "📊 Receita do mês",
  sentimentAlert: "😟 Alerta de sentimento",
};

/** Notifica o dono de um negócio sobre um evento, no(s) canal(is) configurado(s). */
export async function notifyOwner(businessId: string, event: NotifyEvent, message: string, pushUrl?: string) {
  const owner = await prisma.owner.findUnique({ where: { businessId } });
  if (!owner) return;

  const notifyOn = (owner.notifyOn as any) || {};
  if (notifyOn[event] === false) return; // todos os toggles são "ligados" por padrão, a menos que desativados

  const channel: "whatsapp" | "push" | "both" = notifyOn.channel || "both";

  if (channel !== "push") {
    await sendWhatsAppMessage(owner.phone, message);
  }
  if (channel !== "whatsapp") {
    await sendPushToBusiness(businessId, { title: EVENT_TITLES[event], body: message, url: pushUrl ?? "/dashboard" });
  }
}
