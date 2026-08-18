/**
 * Confirmação de agendamentos criados pela página pública — usado tanto
 * pelo webhook do Mercado Pago quanto pelo endpoint de confirmação em
 * modo mock (que simula o webhook enquanto não há conta real).
 */
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { notifyOwner } from "@/lib/notify";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PAYMENT_LABEL: Record<string, string> = {
  pix: "Pix ✅",
  card: "Cartão ✅",
  local: "A pagar no local",
};

export async function confirmAppointmentPayment(appointmentId: string, paymentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { client: true, service: true, professional: true },
  });
  if (!appointment) return null;
  if (appointment.paymentStatus === "PAID") return appointment;

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { paymentStatus: "PAID", status: "CONFIRMED", paymentId },
    include: { client: true, service: true, professional: true },
  });

  await notifyClientConfirmed(updated);
  await notifyOwner(
    updated.businessId,
    "payment",
    `💰 Pagamento recebido: ${formatCurrency(updated.price ?? updated.service.price)} de ${updated.client.name} (${updated.service.name}).`
  );
  return updated;
}

export async function notifyClientConfirmed(appointment: {
  businessId: string;
  client: { name: string; phone: string };
  service: { name: string };
  professional: { name: string };
  date: Date;
  paymentMethod: string | null;
}) {
  const dataFormatada = format(appointment.date, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR });
  const pagamento = appointment.paymentMethod ? PAYMENT_LABEL[appointment.paymentMethod] ?? appointment.paymentMethod : "A combinar";
  const msg = `✅ Agendado, ${appointment.client.name.split(" ")[0]}!

${appointment.service.name} com ${appointment.professional.name}
${dataFormatada}
Pagamento: ${pagamento}

Te mando lembrete 1h antes. Até!`;

  await sendWhatsAppMessage(appointment.client.phone, msg, appointment.businessId);
}
