import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBusinessPlan, hasFeature } from "@/lib/plan-limits";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { UpgradeRequired } from "@/components/shared/UpgradeRequired";
import { FlashSalesPageClient } from "@/components/flash-sales/FlashSalesPageClient";

export default async function FlashSalesPage() {
  const session = await getServerSession(authOptions);
  const businessId = (session?.user as any)?.businessId as string;
  const plan = await getBusinessPlan(businessId);
  const allowed = await hasFeature(businessId, "flashSales");

  return (
    <div>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Feirões" }]} />
      {allowed ? <FlashSalesPageClient /> : <UpgradeRequired feature="Feirões" requiredPlan="BUSINESS" currentPlan={plan} />}
    </div>
  );
}
