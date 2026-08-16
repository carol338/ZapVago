/**
 * Web Push — notificações em tempo real no navegador do dono (Bloco 3 Parte 5).
 * Sem VAPID_PRIVATE_KEY configurada, cai em modo mock (só loga) — mesmo
 * padrão de MOCK_MODE usado em claude.ts/whatsapp.ts.
 */
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:contato@zapvago.app";

const configured = !!(VAPID_PUBLIC && VAPID_PRIVATE);
if (configured) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC!, VAPID_PRIVATE!);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Envia a notificação push pra todas as inscrições ativas do negócio (dono). */
export async function sendPushToBusiness(businessId: string, payload: PushPayload) {
  if (!configured) {
    console.log(`[push.ts MOCK] ${payload.title}: ${payload.body}`);
    return;
  }

  const subs = await prisma.pushSubscription.findMany({ where: { businessId } });
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err: any) {
        // 404/410 = inscrição expirada/revogada no navegador — limpa do banco.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("[push.ts] erro ao enviar push:", err?.message ?? err);
        }
      }
    })
  );
}
