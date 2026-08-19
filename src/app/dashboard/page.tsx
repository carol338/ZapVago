import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBusinessPlan, PLAN_LIMITS } from "@/lib/plan-limits";
import { AgendaGrid } from "@/components/agenda/AgendaGrid";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LoyaltySummaryCard } from "@/components/loyalty/LoyaltySummaryCard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const businessId = (session?.user as any)?.businessId as string;
  const plan = await getBusinessPlan(businessId);
  const features = PLAN_LIMITS[plan].features;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Agenda" }]} />
      <h1 className="mb-4 text-2xl font-bold">Agenda</h1>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <LoyaltySummaryCard />
      </div>
      <AgendaGrid features={features} />
    </div>
  );
}
