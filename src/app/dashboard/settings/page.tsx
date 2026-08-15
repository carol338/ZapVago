import { BusinessSettings } from "@/components/shared/BusinessSettings";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export default function SettingsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Configurações" }]} />
      <h1 className="mb-4 text-2xl font-bold">Configurações</h1>
      <BusinessSettings />
    </div>
  );
}
