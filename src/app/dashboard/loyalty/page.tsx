"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Gift, Trash2, Plus } from "lucide-react";

export default function LoyaltyPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [visitsRequired, setVisitsRequired] = useState(5);
  const [rewardServiceId, setRewardServiceId] = useState("");
  const [rewardDiscount, setRewardDiscount] = useState(100);

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

  async function removeRule(id: string) {
    await fetch(`/api/loyalty/rules/${id}`, { method: "DELETE" });
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
            <Card key={r.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Gift className="text-zap" size={22} />
                  <div>
                    <p className="font-semibold">A cada {r.visitsRequired} visitas</p>
                    <p className="text-sm text-foreground/60">
                      {r.rewardDiscount === 100 ? "1 " : `${r.rewardDiscount}% off em `}
                      {service?.name ?? "serviço"} grátis
                    </p>
                  </div>
                </div>
                <button onClick={() => removeRule(r.id)} className="text-foreground/40 hover:text-risk-high">
                  <Trash2 size={16} />
                </button>
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
    </div>
  );
}
