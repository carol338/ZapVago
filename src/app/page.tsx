import type { Metadata } from "next";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { Hero } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { MidCTA } from "@/components/landing/MidCTA";
import { Differentials } from "@/components/landing/Differentials";
import { VisualDemo } from "@/components/landing/VisualDemo";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { PreFAQCTA } from "@/components/landing/PreFAQCTA";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "ZapVago — Agendamento Inteligente no WhatsApp para Salões, Barbearias e Clínicas",
  description:
    "Automatize agendamentos, pagamentos e fidelidade pelo WhatsApp. Reduza faltas em 80% e aumente seu faturamento. Teste grátis 7 dias.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <LandingHeader />
      <Hero />
      <SocialProof />
      <ProblemSection />
      <SolutionSection />
      <MidCTA />
      <Differentials />
      <VisualDemo />
      <Testimonials />
      <Pricing />
      <PreFAQCTA />
      <FAQSection />
      <FinalCTA />
      <LandingFooter />
    </main>
  );
}
