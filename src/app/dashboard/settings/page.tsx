import { BusinessSettings } from "@/components/shared/BusinessSettings";
import { NotificationSettings } from "@/components/shared/NotificationSettings";
import { WhatsAppSettings } from "@/components/shared/WhatsAppSettings";
import { PrivacySettings } from "@/components/shared/PrivacySettings";
import { IntegrationStatus } from "@/components/shared/IntegrationStatus";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export default function SettingsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Configurações" }]} />
      <h1 className="mb-4 text-2xl font-bold">Configurações</h1>
      <div className="space-y-4">
        <WhatsAppSettings />
        <IntegrationStatus />
        <BusinessSettings />
        <NotificationSettings />
        <PrivacySettings />
      </div>
    </div>
  );
}
