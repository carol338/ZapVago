import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export default function ReportsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Relatórios" }]} />
      <h1 className="mb-4 text-2xl font-bold">Relatórios</h1>
      <ReportsDashboard />
    </div>
  );
}
