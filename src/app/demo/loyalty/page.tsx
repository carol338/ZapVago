import Link from "next/link";
import { Gift, Star } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_CLIENTS, DEMO_LOYALTY_RULE, DEMO_SERVICES } from "@/lib/demo-data";

export default function DemoLoyaltyPage() {
  const rewardService = DEMO_SERVICES.find((s) => s.id === DEMO_LOYALTY_RULE.rewardServiceId);
  const eligible = DEMO_CLIENTS.filter((c) => c.loyaltyPoints >= DEMO_LOYALTY_RULE.visitsRequired).sort((a, b) => b.loyaltyPoints - a.loyaltyPoints);
  const close = DEMO_CLIENTS.filter((c) => c.loyaltyPoints < DEMO_LOYALTY_RULE.visitsRequired).sort((a, b) => b.loyaltyPoints - a.loyaltyPoints);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Fidelidade</h1>

      <Card className="mb-4">
        <div className="flex items-center gap-3">
          <Gift className="text-zap" size={26} />
          <div>
            <p className="font-semibold">A cada {DEMO_LOYALTY_RULE.visitsRequired} visitas</p>
            <p className="text-sm text-foreground/60">
              Prêmio: {rewardService?.name} ({DEMO_LOYALTY_RULE.rewardDiscount}% off)
            </p>
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle className="flex items-center gap-1.5"><Star size={15} className="text-zap-light" /> Clientes elegíveis ao prêmio</CardTitle></CardHeader>
        <div className="space-y-2">
          {eligible.length === 0 && <p className="text-sm text-foreground/40">Nenhum cliente elegível ainda.</p>}
          {eligible.map((c) => (
            <Link
              key={c.id}
              href={`/demo/clients/${c.id}`}
              className="flex min-h-[44px] items-center justify-between rounded-lg border border-zap/30 bg-zap/5 px-3 py-2.5 text-sm hover:bg-zap/10"
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-zap-light">{c.loyaltyPoints}/{DEMO_LOYALTY_RULE.visitsRequired} visitas</span>
            </Link>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Perto do prêmio</CardTitle></CardHeader>
        <div className="space-y-2">
          {close.map((c) => (
            <Link
              key={c.id}
              href={`/demo/clients/${c.id}`}
              className="flex min-h-[44px] items-center justify-between rounded-lg border border-surface-border px-3 py-2.5 text-sm hover:bg-surface-hover"
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-foreground/50">{c.loyaltyPoints}/{DEMO_LOYALTY_RULE.visitsRequired} visitas</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
