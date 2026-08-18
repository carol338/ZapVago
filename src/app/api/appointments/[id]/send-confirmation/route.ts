/**
 * POST /api/appointments/[id]/send-confirmation — dispara uma mensagem
 * extra de confirmação pro cliente, usado quando o risco de falta está
 * alto (botão "Enviar confirmação extra" no modal de detalhes).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const appointment = await prisma.appointment.findFirst({
    where: { id: params.id, businessId },
    include: { client: true, service: true, professional: true },
  });
  if (!appointment) return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });

  const hora = appointment.date.toLocaleString("pt-BR", { weekday: "long", hour: "2-digit", minute: "2-digit" });
  const primeiro = appointment.client.name.split(" ")[0];
  const msg = `${primeiro}, confirmando seu horário de ${hora} com ${appointment.professional.name}. Pode confirmar? 😊`;

  const result = await sendWhatsAppMessage(appointment.client.phone, msg, businessId);

  return NextResponse.json({ ok: true, mocked: result.mocked });
}
