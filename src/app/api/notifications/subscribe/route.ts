/**
 * POST   /api/notifications/subscribe — registra a inscrição Web Push do
 *        navegador do dono (Bloco 3 Parte 5.1).
 * DELETE /api/notifications/subscribe — remove (usado ao desativar push).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const body = await req.json();
  const { endpoint, keys } = body as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Inscrição de push inválida." }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { businessId, p256dh: keys.p256dh, auth: keys.auth },
    create: { businessId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const { endpoint } = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (!endpoint) return NextResponse.json({ error: "endpoint é obrigatório." }, { status: 400 });

  await prisma.pushSubscription.deleteMany({ where: { endpoint, businessId } });
  return NextResponse.json({ ok: true });
}
