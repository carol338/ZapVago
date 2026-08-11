import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar businessName={(session.user as any)?.businessName} />
      <main className="flex-1 overflow-x-hidden p-6">{children}</main>
    </div>
  );
}
