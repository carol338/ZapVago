"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Search } from "lucide-react";

const TAG_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  vip: "info",
  fiel: "success",
  novo: "default",
  sumido: "warning",
  problema: "danger",
};

export function ClientTable() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState("name");

  useEffect(() => {
    const params = new URLSearchParams({ sort });
    if (search) params.set("search", search);
    if (tag) params.set("tag", tag);
    const t = setTimeout(() => {
      fetch(`/api/clients?${params}`).then((r) => r.json()).then(setClients);
    }, 300);
    return () => clearTimeout(t);
  }, [search, tag, sort]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <Input className="pl-9" placeholder="Buscar por nome ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={tag} onChange={(e) => setTag(e.target.value)} className="w-40">
          <option value="">Todas as tags</option>
          <option value="vip">VIP</option>
          <option value="fiel">Fiel</option>
          <option value="novo">Novo</option>
          <option value="sumido">Sumido</option>
          <option value="problema">Problema</option>
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-44">
          <option value="name">Ordenar: Nome</option>
          <option value="totalSpent">Ordenar: Gasto total</option>
          <option value="lastVisit">Ordenar: Última visita</option>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-foreground/50">
              <th className="p-3">Nome</th>
              <th className="p-3">Telefone</th>
              <th className="p-3">Tags</th>
              <th className="p-3">Visitas</th>
              <th className="p-3">Gasto total</th>
              <th className="p-3">Última visita</th>
              <th className="p-3">Risco de falta</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-surface-border last:border-0 hover:bg-surface-hover">
                <td className="p-3">
                  <Link href={`/dashboard/clients/${c.id}`} className="font-medium text-zap-light hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="p-3 text-foreground/60">{c.phone}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map((t: string) => (
                      <Badge key={t} variant={TAG_VARIANT[t] ?? "default"}>{t}</Badge>
                    ))}
                  </div>
                </td>
                <td className="p-3">{c.totalVisits}</td>
                <td className="p-3">{formatCurrency(c.totalSpent)}</td>
                <td className="p-3 text-foreground/60">{c.lastVisitAt ? format(new Date(c.lastVisitAt), "dd/MM/yyyy") : "—"}</td>
                <td className="p-3">
                  {c.predictedNoShowRisk >= 0.5 ? (
                    <Badge variant="danger">{Math.round(c.predictedNoShowRisk * 100)}%</Badge>
                  ) : (
                    <span className="text-foreground/40">{Math.round(c.predictedNoShowRisk * 100)}%</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && <p className="p-6 text-center text-sm text-foreground/40">Nenhum cliente encontrado.</p>}
      </div>
    </div>
  );
}
