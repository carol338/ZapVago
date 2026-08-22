import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/shared/Sidebar";
import { BottomNav } from "@/components/shared/BottomNav";
import { PageTransition } from "@/components/shared/PageTransition";
import { DemoDataBanner } from "@/components/shared/DemoDataBanner";
import { getBusinessPlan, PLAN_LIMITS } from "@/lib/plan-limits";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const businessId = (session.user as any)?.businessId as string;
  const [plan, demoAppointments, demoClients, business] = await Promise.all([
    getBusinessPlan(businessId),
    prisma.appointment.count({ where: { businessId, isDemo: true } }),
    prisma.client.count({ where: { businessId, isDemo: true } }),
    prisma.business.findUnique({ where: { id: businessId }, select: { settings: true } }),
  ]);
  const features = PLAN_LIMITS[plan].features;
  const demoBannerDismissed = !!(business?.settings as any)?.demoBannerDismissed;
  const showDemoBanner = (demoAppointments > 0 || demoClients > 0) && !demoBannerDismissed;

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar businessName={(session.user as any)?.businessName} features={features} />
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 pb-20 md:p-6 md:pb-6">
        <DemoDataBanner initiallyVisible={showDemoBanner} />
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav features={features} />
    </div>
  );
}
