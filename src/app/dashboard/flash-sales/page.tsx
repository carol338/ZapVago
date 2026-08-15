"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlashSaleModal } from "@/components/flash-sales/FlashSaleModal";
import { Zap, Send, Calendar } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export default function FlashSalesPage() {
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

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
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Feirões" }]} />
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
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1"><Send size={14} className="text-foreground/40" /> {f.sentCount} enviados</span>
              <span className="flex items-center gap-1"><Calendar size={14} className="text-foreground/40" /> {f.bookedCount} agendados</span>
            </div>
          </Card>
        ))}
        {flashSales.length === 0 && <p className="col-span-full text-sm text-foreground/40">Nenhum feirão criado ainda. Crie um para preencher horários ociosos!</p>}
      </div>

      <FlashSaleModal open={modalOpen} onClose={() => { setModalOpen(false); load(); }} services={services} professionals={professionals} />
    </div>
  );
}
