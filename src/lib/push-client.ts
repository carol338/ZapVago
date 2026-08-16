/**
 * Utilitários de Web Push do lado do navegador (Bloco 3 Parte 5.1) —
 * registra o service worker, pede permissão e envia a inscrição pro
 * back-end guardar em PushSubscription.
 */

export function isPushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function subscribeToPush() {
  if (!isPushSupported()) throw new Error("Push não suportado nesse navegador.");

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) throw new Error("VAPID não configurado.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permissão negada.");

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  const json = subscription.toJSON();
  const res = await fetch("/api/notifications/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
  if (!res.ok) throw new Error("Não foi possível salvar a inscrição.");

  return subscription;
}
