import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { FadeIn } from "./FadeIn";
import { LaunchOfferBanner } from "./LaunchOfferBanner";

const DEPOIMENTOS = [
  {
    nome: "João Pereira",
    negocio: "Barbearia do Zé",
    cidade: "São Paulo, SP",
    foto: "/testimonials/joao-pereira.webp",
    texto:
      "Antes eu perdia 2 horas por dia respondendo WhatsApp. Agora o bot agenda sozinho e eu só atendo. Meu faturamento subiu 40%.",
    resultado: "Faltas caíram de 20% para 2%",
  },
  {
    nome: "Ana Souza",
    negocio: "Clínica de Estética Bella",
    cidade: "Belo Horizonte, MG",
    foto: "/testimonials/ana-souza.webp",
    texto:
      "O prontuário inteligente faz minhas clientes se sentirem VIP. Elas voltam mais e gastam mais. Recuperei R$ 3.000/mês só com o feirão.",
    resultado: "Faturamento +35% em 2 meses",
  },
  {
    nome: "Camila Rocha",
    negocio: "Salão Camila Rocha",
    cidade: "Recife, PE",
    foto: "/testimonials/camila-rocha.webp",
    texto:
      "Meu salão tem 4 profissionais e antes eu vivia confundindo agenda. Agora cada uma tem sua cor e nenhuma cliente é esquecida. Lotamos os sábados sem esforço.",
    resultado: "Ocupação aos sábados: 60% → 100%",
  },
];

export function Testimonials() {
  return (
    <section className="border-y border-surface-border bg-surface/30">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <FadeIn>
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Quem usa, não volta atrás</h2>
        </FadeIn>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {DEPOIMENTOS.map((d, i) => (
            <FadeIn key={d.nome} direction="right" delay={i * 100}>
              <Card className="h-full border-zap/20">
                <div className="mb-3 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={d.foto}
                    alt={`Foto de ${d.nome} — ${d.negocio}`}
                    width={56}
                    height={56}
                    className="h-14 w-14 shrink-0 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium">{d.nome}</p>
                    <p className="text-xs text-foreground/50">{d.negocio}</p>
                    <p className="text-xs text-foreground/40">{d.cidade}</p>
                  </div>
                </div>
                <p className="mb-4 text-sm text-foreground/80">&quot;{d.texto}&quot;</p>
                <div className="mb-4 flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={15} className="fill-current" />
                  ))}
                </div>
                <p className="inline-block rounded-full bg-zap/10 px-3 py-1 text-xs font-bold text-zap-light">
                  Resultado: {d.resultado}
                </p>
              </Card>
            </FadeIn>
          ))}
        </div>

        <LaunchOfferBanner />
      </div>
    </section>
  );
}
