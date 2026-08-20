import { Loader2 } from "lucide-react";

/** Fallback de Suspense pra qualquer navegação de topo sem loading.tsx próprio (páginas dentro de /dashboard já têm o delas). */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="animate-spin text-zap" size={28} />
    </div>
  );
}
