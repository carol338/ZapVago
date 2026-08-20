"use client";

/**
 * Aviso de conexão perdida — cobre o caso de o usuário ficar offline COM o
 * app já aberto (o caso de abrir o app já sem internet nenhuma é tratado
 * pelo próprio navegador antes de qualquer JS nosso rodar). Monta uma vez
 * em Providers, então aparece em qualquer página, painel ou pública.
 */
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-risk-high px-4 py-2.5 text-center text-sm font-medium text-white"
    >
      <WifiOff size={16} className="shrink-0" />
      <span>Você está offline. Verifique sua conexão e tente novamente.</span>
    </div>
  );
}
