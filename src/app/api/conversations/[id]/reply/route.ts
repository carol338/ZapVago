/** POST /api/conversations/[id]/reply — dono responde manualmente pelo painel; mensagem sai pelo WhatsApp. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const { content } = await req.json();
  const conversation = await prisma.conversation.findFirst({ where: { id: params.id, businessId } });
  if (!conversation) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });

  const messages = [...((conversation.messages as any[]) ?? []), { role: "owner", content, timestamp: new Date().toISOString() }];
  await prisma.conversation.update({ where: { id: params.id }, data: { messages, status: "HUMAN_HANDLING" } });

  await sendWhatsAppMessage(conversation.clientPhone, content);
  return NextResponse.json({ ok: true });
}
