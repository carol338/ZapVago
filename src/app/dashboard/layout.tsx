import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar businessName={(session.user as any)?.businessName} />
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
    </div>
  );
}
