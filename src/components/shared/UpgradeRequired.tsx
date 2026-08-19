import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import type { PlanName } from "@/lib/plan-limits";

const PLAN_LABEL: Record<PlanName, string> = { FREE: "Grátis", PRO: "Pro", BUSINESS: "Business" };

/** Bloqueio de tela inteira pra funcionalidades indisponíveis no plano atual. */
export function UpgradeRequired({
  feature,
  requiredPlan,
  currentPlan,
}: {
  feature: string;
  requiredPlan: PlanName;
  currentPlan: PlanName;
}) {
  return (
    <Card className="mx-auto flex max-w-md flex-col items-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zap/15 text-zap-light">
        <Lock size={22} />
      </div>
      <h2 className="text-lg font-bold">{feature} é exclusivo do plano {PLAN_LABEL[requiredPlan]}</h2>
      <p className="text-sm text-foreground/60">
        Seu plano atual é {PLAN_LABEL[currentPlan]}. Faça upgrade para desbloquear esta funcionalidade.
      </p>
      <Link
        href="/#planos"
        className="mt-2 inline-flex h-11 items-center rounded-lg bg-zap px-5 text-sm font-semibold text-white transition-colors hover:bg-zap-dark"
      >
        Fazer upgrade
      </Link>
    </Card>
  );
}
