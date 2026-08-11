import { ClientProfile } from "@/components/clients/ClientProfile";

export default function ClientProfilePage({ params }: { params: { id: string } }) {
  return (
    <div>
      <ClientProfile clientId={params.id} />
    </div>
  );
}
