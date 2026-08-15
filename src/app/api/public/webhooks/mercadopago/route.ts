/**
 * POST /api/public/webhooks/mercadopago — callback de confirmação de
 * pagamento. Numa integração real, o Mercado Pago chama essa rota com o
 * payload/assinatura dele e a gente busca o pagamento pela API deles pra
 * confirmar. Em MOCK_MODE (sem conta configurada), essa mesma rota é
 * usada pelo botão "Já paguei" da página de agendamento pra simular a
 * confirmação do Pix.
 */
import { NextRequest, NextResponse } from "next/server";
import { confirmAppointmentPayment } from "@/lib/booking";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { appointmentId, paymentId } = body as { appointmentId?: string; paymentId?: string };

  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId é obrigatório." }, { status: 400 });
  }

  const appointment = await confirmAppointmentPayment(appointmentId, paymentId ?? `mock_confirm_${Date.now()}`);
  if (!appointment) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ status: appointment.status, paymentStatus: appointment.paymentStatus });
}
