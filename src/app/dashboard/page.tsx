import { AgendaGrid } from "@/components/agenda/AgendaGrid";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LoyaltySummaryCard } from "@/components/loyalty/LoyaltySummaryCard";

export default function DashboardPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Agenda" }]} />
      <h1 className="mb-4 text-2xl font-bold">Agenda</h1>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <LoyaltySummaryCard />
      </div>
      <AgendaGrid />
    </div>
  );
}
