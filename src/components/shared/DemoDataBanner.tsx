"use client";

import { useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DemoDataBanner({ initiallyVisible }: { initiallyVisible: boolean }) {
  const [visible, setVisible] = useState(initiallyVisible);
  const [deleting, setDeleting] = useState(false);

  if (!visible) return null;

  async function dismiss() {
    setVisible(false);
    await fetch("/api/onboarding/demo-data/dismiss", { method: "POST" }).catch(() => {});
  }

  async function deleteDemoData() {
    setDeleting(true);
    await fetch("/api/onboarding/demo-data", { method: "DELETE" }).catch(() => {});
    // Recarrega a página inteira, não só o layout: a agenda, a lista de
    // clientes etc. buscam os próprios dados em componentes client-side
    // (useEffect), então um router.refresh() (só re-renderiza Server
    // Components) não seria suficiente pra tirar os agendamentos/clientes
    // demo que já estavam na tela.
    window.location.reload();
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-zap/30 bg-zap/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-sm text-foreground">
        <Sparkles size={18} className="mt-0.5 shrink-0 text-zap" />
        <span>
          <strong>Bem-vindo!</strong> Criamos alguns agendamentos de teste para você ver como o ZapVago funciona.
        </span>
      </p>
      <div className="flex shrink-0 gap-2">
        <Button variant="secondary" size="sm" onClick={deleteDemoData} disabled={deleting}>
          <Trash2 size={14} /> {deleting ? "Excluindo..." : "Excluir testes"}
        </Button>
        <Button variant="ghost" size="sm" onClick={dismiss} disabled={deleting}>
          Entendi
        </Button>
      </div>
    </div>
  );
}
