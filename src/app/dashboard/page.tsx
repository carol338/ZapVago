import { AgendaGrid } from "@/components/agenda/AgendaGrid";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Agenda</h1>
      <AgendaGrid />
    </div>
  );
}
