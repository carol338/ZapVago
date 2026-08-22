import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { DEMO_CLIENTS } from "@/lib/demo-data";

const TAG_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  vip: "info",
  fiel: "success",
  novo: "default",
  sumido: "warning",
  problema: "danger",
};

export default function DemoClientsPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Clientes</h1>
      <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-foreground/50">
              <th className="p-3">Nome</th>
              <th className="p-3">Telefone</th>
              <th className="p-3">Tags</th>
              <th className="p-3">Visitas</th>
              <th className="p-3">Gasto total</th>
              <th className="p-3">Risco de falta</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_CLIENTS.map((c) => (
              <tr key={c.id} className="border-b border-surface-border last:border-0 hover:bg-surface-hover">
                <td className="p-0">
                  <Link href={`/demo/clients/${c.id}`} className="flex min-h-[44px] items-center px-3 py-3 font-medium text-zap-light hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="p-3 text-foreground/60">{c.phone}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map((t) => (
                      <Badge key={t} variant={TAG_VARIANT[t] ?? "default"}>{t}</Badge>
                    ))}
                  </div>
                </td>
                <td className="p-3">{c.totalVisits}</td>
                <td className="p-3">{formatCurrency(c.totalSpent)}</td>
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
      </div>
    </div>
  );
}
