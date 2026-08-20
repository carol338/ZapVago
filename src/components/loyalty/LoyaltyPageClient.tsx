"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Gift, Trash2, Plus } from "lucide-react";

export function LoyaltyPageClient() {
  const [rules, setRules] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [visitsRequired, setVisitsRequired] = useState(5);
  const [rewardServiceId, setRewardServiceId] = useState("");
  const [rewardDiscount, setRewardDiscount] = useState(100);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    fetch("/api/loyalty/rules").then((r) => r.json()).then(setRules);
  }

  useEffect(() => {
    load();
    fetch("/api/services").then((r) => r.json()).then((data) => {
      setServices(data);
      if (data[0]) setRewardServiceId(data[0].id);
    });
  }, []);

  async function createRule() {
    await fetch("/api/loyalty/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitsRequired, rewardServiceId, rewardDiscount }),
    });
    setModalOpen(false);
    load();
  }

  async function toggleActive(rule: any) {
    setTogglingId(rule.id);
    const nextActive = !rule.active;
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, active: nextActive } : r)));
    try {
      await fetch(`/api/loyalty/rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      });
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    if (!ruleToDelete) return;
    setDeleting(true);
    await fetch(`/api/loyalty/rules/${ruleToDelete.id}`, { method: "DELETE" });
    setDeleting(false);
    setRuleToDelete(null);
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fidelidade</h1>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} className="mr-1" /> Nova regra</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {rules.map((r) => {
          const service = services.find((s) => s.id === r.rewardServiceId);
          return (
            <Card key={r.id} className={r.active === false ? "opacity-60" : undefined}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Gift className="text-zap" size={22} />
                  <div>
                    <p className="font-semibold">A cada {r.visitsRequired} visitas</p>
                    <p className="text-sm text-foreground/60">
                      Prêmio: {service?.name ?? "serviço"} ({r.rewardDiscount === 100 ? "100% desconto" : `${r.rewardDiscount}% off`})
                    </p>
                  </div>
                </div>
                <button onClick={() => setRuleToDelete(r)} className="-m-2 flex h-11 w-11 items-center justify-center rounded-lg text-foreground/40 transition-colors hover:bg-risk-high/10 hover:text-risk-high">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-surface-border pt-3">
                <button
                  type="button"
                  onClick={() => toggleActive(r)}
                  disabled={togglingId === r.id}
                  aria-pressed={r.active !== false}
                  className="-my-3 flex h-11 w-11 shrink-0 items-center justify-center disabled:opacity-50"
                >
                  <span className={`h-5 w-9 rounded-full transition-colors ${r.active !== false ? "bg-zap" : "bg-surface-border"}`}>
                    <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${r.active !== false ? "translate-x-4" : "translate-x-0.5"}`} />
                  </span>
                </button>
                <span className="text-sm text-foreground/60">{r.active !== false ? "Ativa" : "Inativa"}</span>
              </div>
            </Card>
          );
        })}
        {rules.length === 0 && <p className="col-span-full text-sm text-foreground/40">Nenhuma regra de fidelidade criada ainda.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova regra de fidelidade">
        <div className="space-y-3">
          <div>
            <Label>Visitas necessárias</Label>
            <Input type="number" value={visitsRequired} onChange={(e) => setVisitsRequired(Number(e.target.value))} />
          </div>
          <div>
            <Label>Serviço de recompensa</Label>
            <Select value={rewardServiceId} onChange={(e) => setRewardServiceId(e.target.value)}>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Desconto (%, 100 = grátis)</Label>
            <Input type="number" value={rewardDiscount} onChange={(e) => setRewardDiscount(Number(e.target.value))} />
          </div>
          <Button onClick={createRule} className="w-full">Criar regra</Button>
        </div>
      </Modal>

      <Modal open={!!ruleToDelete} onClose={() => setRuleToDelete(null)} title="⚠️ Excluir regra">
        {ruleToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-foreground/80">
              Tem certeza que deseja excluir a regra{" "}
              <span className="font-semibold">
                &quot;A cada {ruleToDelete.visitsRequired} visitas, {services.find((s) => s.id === ruleToDelete.rewardServiceId)?.name ?? "serviço"} grátis&quot;
              </span>
              ?
            </p>
            <p className="text-sm text-risk-high">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <Button variant="danger" onClick={confirmDelete} disabled={deleting} className="flex-1">
                {deleting ? "Excluindo..." : "Excluir"}
              </Button>
              <Button variant="secondary" onClick={() => setRuleToDelete(null)} disabled={deleting} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
