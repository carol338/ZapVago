import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  const businessId = (session?.user as any)?.businessId;
  if (!businessId) redirect("/login");

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) redirect("/login");

  return <OnboardingWizard category={business.category} />;
}
