"use client";

/**
 * LGPD — exercício dos direitos do titular direto do painel (Art. 18):
 * exportar todos os dados (portabilidade) ou excluir a conta definitivamente
 * (eliminação). Ver POST /api/lgpd/export e POST /api/lgpd/delete.
 */
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Download, ShieldAlert, Loader2 } from "lucide-react";

export function PrivacySettings() {
  const [exporting, setExporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function exportData() {
    setExporting(true);
    try {
      const res = await fetch("/api/lgpd/export", { method: "POST" });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "zapvago-dados.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Não foi possível gerar o arquivo agora. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/lgpd/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error);
      }
      await signOut({ callbackUrl: "/" });
    } catch (e: any) {
      setError(e.message || "Não foi possível excluir a conta agora. Tente novamente.");
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Privacidade e dados (LGPD)</CardTitle></CardHeader>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">Exportar meus dados</p>
            <p className="text-sm text-foreground/60">Baixa um arquivo JSON com todos os dados do negócio: seus dados, clientes, agendamentos e conversas.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={exportData} disabled={exporting}>
            {exporting ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Download size={14} className="mr-1" />}
            {exporting ? "Gerando..." : "Exportar dados"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-border pt-4">
          <div>
            <p className="font-medium text-risk-high">Excluir minha conta</p>
            <p className="text-sm text-foreground/60">Apaga permanentemente sua conta, clientes, agendamentos e todo o resto. Não pode ser desfeito.</p>
          </div>
          <Button size="sm" variant="danger" onClick={() => setConfirmOpen(true)}>
            <ShieldAlert size={14} className="mr-1" /> Excluir conta
          </Button>
        </div>

        {error && <p className="text-sm text-risk-high">{error}</p>}
      </div>

      <Modal open={confirmOpen} onClose={() => { setConfirmOpen(false); setConfirmText(""); }} title="⚠️ Excluir conta permanentemente">
        <div className="space-y-4">
          <p className="text-sm text-foreground/80">
            Tem certeza? <span className="font-semibold text-risk-high">Esta ação é irreversível.</span> Todos os dados do negócio —
            clientes, agendamentos, conversas, lista de espera, feirões e fidelidade — serão apagados permanentemente, junto com sua conta.
          </p>
          <div>
            <p className="mb-1 text-sm text-foreground/60">
              Digite <span className="font-mono font-semibold">excluir</span> para confirmar:
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={deleteAccount}
              disabled={confirmText.trim().toLowerCase() !== "excluir" || deleting}
              className="flex-1"
            >
              {deleting ? "Excluindo..." : "Excluir definitivamente"}
            </Button>
            <Button variant="secondary" onClick={() => { setConfirmOpen(false); setConfirmText(""); }} disabled={deleting} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
