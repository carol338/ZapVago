import { ClientTable } from "@/components/clients/ClientTable";

export default function ClientsPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Clientes</h1>
      <ClientTable />
    </div>
  );
}
