import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBusinessPlan, hasFeature } from "@/lib/plan-limits";
import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { UpgradeRequired } from "@/components/shared/UpgradeRequired";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  const businessId = (session?.user as any)?.businessId as string;
  const plan = await getBusinessPlan(businessId);
  const allowed = await hasFeature(businessId, "advancedReports");

  return (
    <div>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Relatórios" }]} />
      <h1 className="mb-4 text-2xl font-bold">Relatórios</h1>
      {allowed ? <ReportsDashboard /> : <UpgradeRequired feature="Relatórios avançados" requiredPlan="BUSINESS" currentPlan={plan} />}
    </div>
  );
}
