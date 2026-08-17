import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { FadeIn } from "./FadeIn";

const DEPOIMENTOS = [
  {
    nome: "João",
    papel: "Dono de Barbearia",
    texto: "Reduzi as faltas de 20% para 2%. Agora tenho previsibilidade de receita.",
    cor: "#00A884",
  },
  {
    nome: "Ana",
    papel: "Clínica de Estética",
    texto: "O prontuário inteligente faz minhas clientes se sentirem únicas. Voltaram mais!",
    cor: "#3B82F6",
  },
  {
    nome: "Carlos",
    papel: "Pet Shop",
    texto: "O feirão preencheu minhas terças vazias. Recuperei R$ 3.000/mês.",
    cor: "#F59E0B",
  },
];

export function Testimonials() {
  return (
    <section className="border-y border-surface-border bg-surface/30">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <FadeIn>
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Quem usa, recomenda</h2>
        </FadeIn>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {DEPOIMENTOS.map((d, i) => (
            <FadeIn key={d.nome} delay={i * 100}>
              <Card className="h-full">
                <div className="mb-3 flex gap-0.5 text-zap-light">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={15} className="fill-current" />
                  ))}
                </div>
                <p className="mb-4 text-sm text-foreground/80">&quot;{d.texto}&quot;</p>
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: d.cor }}
                  >
                    {d.nome[0]}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{d.nome}</p>
                    <p className="text-xs text-foreground/50">{d.papel}</p>
                  </div>
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
