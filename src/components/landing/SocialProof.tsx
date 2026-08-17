import { FadeIn } from "./FadeIn";

const STATS = [
  { value: "1.234", label: "negócios ativos" },
  { value: "45.678", label: "agendamentos/mês" },
  { value: "98%", label: "de satisfação" },
  { value: "R$ 2M+", label: "em pagamentos processados" },
];

const SEGMENTOS = ["Barbearias", "Salões de beleza", "Clínicas de estética", "Manicures", "Pet shops", "Estúdios de tatuagem"];

export function SocialProof() {
  return (
    <section className="border-y border-surface-border bg-surface/50">
      <FadeIn className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-zap-light sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-foreground/50 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-foreground/40">
          Usado por {SEGMENTOS.join(" · ")} em todo o Brasil
        </p>
      </FadeIn>
    </section>
  );
}
