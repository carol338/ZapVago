/**
 * Limites e features por plano — Business.plan (FREE/PRO/BUSINESS). Fonte
 * única da verdade pra tudo que bloqueia/libera funcionalidade por plano;
 * a tabela de planos da landing (src/components/landing/Pricing.tsx) foi
 * conferida contra isto e bate 1:1.
 */
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export type Feature = "waitingList" | "flashSales" | "loyalty" | "advancedReports" | "noShowPrediction" | "sentiment";

export const PLAN_LIMITS = {
  FREE: {
    label: "Grátis",
    maxAppointmentsPerMonth: 50,
    maxProfessionals: 1,
    features: {
      waitingList: false,
      flashSales: false,
      loyalty: false,
      advancedReports: false,
      noShowPrediction: false,
      sentiment: false,
    },
  },
  PRO: {
    label: "Pro",
    maxAppointmentsPerMonth: null, // ilimitado
    maxProfessionals: 5,
    features: {
      waitingList: true,
      flashSales: false,
      loyalty: true,
      advancedReports: false,
      noShowPrediction: false,
      sentiment: false,
    },
  },
  BUSINESS: {
    label: "Business",
    maxAppointmentsPerMonth: null,
    maxProfessionals: null, // ilimitado
    features: {
      waitingList: true,
      flashSales: true,
      loyalty: true,
      advancedReports: true,
      noShowPrediction: true,
      sentiment: true,
    },
  },
} as const satisfies Record<
  string,
  { label: string; maxAppointmentsPerMonth: number | null; maxProfessionals: number | null; features: Record<Feature, boolean> }
>;

export type PlanName = keyof typeof PLAN_LIMITS;

export async function getBusinessPlan(businessId: string): Promise<PlanName> {
  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { plan: true } });
  return (business?.plan as PlanName) ?? "FREE";
}

export interface LimitCheck {
  allowed: boolean;
  plan: PlanName;
  limit: number | null; // null = ilimitado
  used: number;
}

/**
 * Conta TODOS os agendamentos criados no mês corrente (por createdAt, não
 * pela data do horário marcado — é um limite de "quantos você criou esse
 * mês", não de "quantos horários você tem em determinado mês"), incluindo
 * cancelados: um agendamento criado e depois cancelado ainda consumiu uma
 * criação — contar só os não-cancelados abriria brecha pra criar/cancelar
 * em loop pra furar o limite.
 */
export async function canCreateAppointment(businessId: string): Promise<LimitCheck> {
  const plan = await getBusinessPlan(businessId);
  const limit = PLAN_LIMITS[plan].maxAppointmentsPerMonth;
  if (limit === null) return { allowed: true, plan, limit: null, used: 0 };

  const now = new Date();
  const used = await prisma.appointment.count({
    where: { businessId, createdAt: { gte: startOfMonth(now), lte: endOfMonth(now) } },
  });
  return { allowed: used < limit, plan, limit, used };
}

export async function canAddProfessional(businessId: string): Promise<LimitCheck> {
  const plan = await getBusinessPlan(businessId);
  const limit = PLAN_LIMITS[plan].maxProfessionals;
  if (limit === null) return { allowed: true, plan, limit: null, used: 0 };

  const used = await prisma.professional.count({ where: { businessId } });
  return { allowed: used < limit, plan, limit, used };
}

export async function hasFeature(businessId: string, feature: Feature): Promise<boolean> {
  const plan = await getBusinessPlan(businessId);
  return PLAN_LIMITS[plan].features[feature];
}
