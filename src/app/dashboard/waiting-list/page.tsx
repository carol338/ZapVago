import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBusinessPlan, hasFeature } from "@/lib/plan-limits";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { UpgradeRequired } from "@/components/shared/UpgradeRequired";
import { WaitingListPageClient } from "@/components/waiting-list/WaitingListPageClient";

export default async function WaitingListPage() {
  const session = await getServerSession(authOptions);
  const businessId = (session?.user as any)?.businessId as string;
  const plan = await getBusinessPlan(businessId);
  const allowed = await hasFeature(businessId, "waitingList");

  return (
    <div>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Lista de Espera" }]} />
      {allowed ? <WaitingListPageClient /> : <UpgradeRequired feature="Lista de Espera" requiredPlan="PRO" currentPlan={plan} />}
    </div>
  );
}
