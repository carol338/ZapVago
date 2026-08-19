"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlashSaleModal } from "@/components/flash-sales/FlashSaleModal";
import { Zap, Send, Calendar, TrendingUp, DollarSign, Check, Copy } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function FlashSalesPageClient() {
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyLink(id: string, link: string) {
    await navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
  }

  function load() {
    fetch("/api/flash-sales").then((r) => r.json()).then(setFlashSales);
  }

  useEffect(() => {
    load();
    fetch("/api/services").then((r) => r.json()).then(setServices);
    fetch("/api/professionals").then((r) => r.json()).then(setProfessionals);
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feirões</h1>
        <Button onClick={() => setModalOpen(true)}><Zap size={16} className="mr-1" /> Criar feirão</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {flashSales.map((f) => (
          <Card key={f.id}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">{f.name}</h3>
              <Badge variant={f.active ? "success" : "default"}>{f.active ? "Ativo" : "Encerrado"}</Badge>
            </div>
            <p className="mb-3 text-sm text-foreground/60">{f.discountPercent}% OFF — {f.timeStart} às {f.timeEnd}</p>
            <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="flex items-center gap-1"><Send size={14} className="text-foreground/40" /> {f.sentCount} enviados</span>
              <span className="flex items-center gap-1"><Calendar size={14} className="text-foreground/40" /> {f.bookedCount} agendados</span>
            </div>
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="flex items-center gap-1"><TrendingUp size={14} className="text-foreground/40" /> {f.conversionRate}% conversão</span>
              <span className="flex items-center gap-1 text-zap-light"><DollarSign size={14} /> {formatCurrency(f.revenue)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-surface-border pt-3">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-background px-2 py-1.5 text-[11px] text-foreground/70">{f.link}</code>
              <Button size="sm" variant="secondary" onClick={() => copyLink(f.id, f.link)}>
                {copiedId === f.id ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                {copiedId === f.id ? "Copiado!" : "Copiar"}
              </Button>
            </div>
          </Card>
        ))}
        {flashSales.length === 0 && <p className="col-span-full text-sm text-foreground/40">Nenhum feirão criado ainda. Crie um para preencher horários ociosos!</p>}
      </div>

      <FlashSaleModal open={modalOpen} onClose={() => { setModalOpen(false); load(); }} services={services} professionals={professionals} />
    </div>
  );
}
