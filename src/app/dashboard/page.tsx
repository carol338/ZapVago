import { AgendaGrid } from "@/components/agenda/AgendaGrid";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export default function DashboardPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Agenda" }]} />
      <h1 className="mb-4 text-2xl font-bold">Agenda</h1>
      <AgendaGrid />
    </div>
  );
}
