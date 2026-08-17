import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Zap, ArrowRight } from "lucide-react";
import { FadeIn } from "./FadeIn";

const DEPOIMENTOS = [
  {
    nome: "João Pereira",
    papel: "Dono da Barbearia do Zé",
    cor: "#00A884",
    texto:
      "Antes eu perdia 2 horas por dia respondendo WhatsApp. Agora o bot agenda sozinho e eu só atendo. Meu faturamento subiu 40%.",
    resultado: "Faltas caíram de 20% para 2%",
  },
  {
    nome: "Ana Souza",
    papel: "Clínica de Estética Bella",
    cor: "#3B82F6",
    texto:
      "O prontuário inteligente faz minhas clientes se sentirem VIP. Elas voltam mais e gastam mais. Recuperei R$ 3.000/mês só com o feirão.",
    resultado: "Faturamento +35% em 2 meses",
  },
  {
    nome: "Carlos Lima",
    papel: "Pet Shop Animal Feliz",
    cor: "#F59E0B",
    texto: "A lista de espera ativa preenche meus cancelamentos sozinha. Nunca mais tive horário vago num sábado.",
    resultado: "Zero horários ociosos aos sábados",
  },
];

const VAGAS_TOTAL = 50;
const VAGAS_PREENCHIDAS = 32;
const VAGAS_RESTANTES = VAGAS_TOTAL - VAGAS_PREENCHIDAS;

export function Testimonials() {
  return (
    <section className="border-y border-surface-border bg-surface/30">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <FadeIn>
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Quem usa, não volta atrás</h2>
        </FadeIn>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {DEPOIMENTOS.map((d, i) => (
            <FadeIn key={d.nome} delay={i * 100}>
              <Card className="h-full border-zap/20">
                <p className="mb-4 text-sm text-foreground/80">&quot;{d.texto}&quot;</p>
                <div className="mb-4 flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={15} className="fill-current" />
                  ))}
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: d.cor }}
                  >
                    {d.nome[0]}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{d.nome}</p>
                    <p className="text-xs text-foreground/50">{d.papel}</p>
                  </div>
                </div>
                <p className="mt-3 inline-block rounded-full bg-zap/10 px-3 py-1 text-xs font-bold text-zap-light">
                  {d.resultado}
                </p>
              </Card>
            </FadeIn>
          ))}
        </div>

        {/* Urgência — oferta de lançamento */}
        <FadeIn delay={300} className="mt-10">
          <div className="mx-auto max-w-xl rounded-2xl border border-orange-500/40 bg-orange-500/[0.06] p-6 text-center sm:p-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-400">
              <Zap size={13} className="fill-orange-400" /> OFERTA DE LANÇAMENTO
            </span>
            <p className="mt-4 text-2xl font-bold">
              Teste grátis por 14 dias <span className="text-base font-normal text-foreground/50">(em vez de 7)</span>
            </p>
            <p className="mt-2 text-sm text-foreground/60">Apenas {VAGAS_TOTAL} vagas para novos negócios</p>

            <div className="mx-auto mt-4 max-w-xs">
              <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: `${(VAGAS_PREENCHIDAS / VAGAS_TOTAL) * 100}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-foreground/50">
                <span>{VAGAS_PREENCHIDAS} já preenchidas</span>
                <span className="font-medium text-orange-400">{VAGAS_RESTANTES} restantes</span>
              </div>
            </div>

            <Link href="/register" className="mt-6 block">
              <Button className="min-h-[48px] w-full bg-orange-500 px-8 text-white hover:bg-orange-600 sm:w-auto">
                Quero minha vaga <ArrowRight size={16} className="ml-1.5" />
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
