import { ClientTable } from "@/components/clients/ClientTable";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export default function ClientsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Clientes" }]} />
      <h1 className="mb-4 text-2xl font-bold">Clientes</h1>
      <ClientTable />
    </div>
  );
}
