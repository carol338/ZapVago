import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBusinessPlan, hasFeature } from "@/lib/plan-limits";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { UpgradeRequired } from "@/components/shared/UpgradeRequired";
import { LoyaltyPageClient } from "@/components/loyalty/LoyaltyPageClient";

export default async function LoyaltyPage() {
  const session = await getServerSession(authOptions);
  const businessId = (session?.user as any)?.businessId as string;
  const plan = await getBusinessPlan(businessId);
  const allowed = await hasFeature(businessId, "loyalty");

  return (
    <div>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Fidelidade" }]} />
      {allowed ? <LoyaltyPageClient /> : <UpgradeRequired feature="Fidelidade" requiredPlan="PRO" currentPlan={plan} />}
    </div>
  );
}
