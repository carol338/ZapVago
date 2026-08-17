import type { Metadata } from "next";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { Hero } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { MidCTA } from "@/components/landing/MidCTA";
import { Differentials } from "@/components/landing/Differentials";
import { VisualDemo } from "@/components/landing/VisualDemo";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Testimonials } from "@/components/landing/Testimonials";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { Pricing } from "@/components/landing/Pricing";
import { PreFAQCTA } from "@/components/landing/PreFAQCTA";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

const TITLE = "ZapVago — Agendamento Inteligente no WhatsApp para Salões, Barbearias e Clínicas";
const DESCRIPTION =
  "Automatize agendamentos, pagamentos e fidelidade pelo WhatsApp. Reduza faltas em 80% e aumente seu faturamento. Teste grátis 14 dias. Sem cartão de crédito.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "ZapVago — Sua agenda no piloto automático",
    description: "Agende, cobre e fidelize clientes pelo WhatsApp sem digitar uma palavra.",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZapVago — Agendamento Inteligente",
    description: "Sua agenda lotada sem você tocar no celular.",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ZapVago",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "Agendamento inteligente via WhatsApp para pequenos negócios",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "297",
    priceCurrency: "BRL",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "127",
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <LandingHeader />
      <Hero />
      <SocialProof />
      <ProblemSection />
      <SolutionSection />
      <MidCTA />
      <Differentials />
      <VisualDemo />
      <HowItWorks />
      <Testimonials />
      <ComparisonTable />
      <Pricing />
      <PreFAQCTA />
      <FAQSection />
      <FinalCTA />
      <LandingFooter />
    </main>
  );
}
