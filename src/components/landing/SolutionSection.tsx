import { MessageCircle, Brain, DollarSign } from "lucide-react";
import { FadeIn } from "./FadeIn";

const STEPS = [
  { icon: MessageCircle, title: "Cliente manda mensagem" },
  { icon: Brain, title: "IA entende e agenda" },
  { icon: DollarSign, title: "Pagamento confirmado" },
];

export function SolutionSection() {
  return (
    <section className="border-y border-surface-border bg-surface/30">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <FadeIn>
          <h2 className="text-center text-3xl font-bold sm:text-4xl">O ZapVago resolve isso sozinho</h2>
        </FadeIn>

        <div className="mt-12 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <FadeIn>
            <div className="space-y-6">
              {STEPS.map((s, i) => (
                <div key={s.title} className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zap/10 text-zap-light">
                    <s.icon size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground/40">Passo {i + 1}</p>
                    <p className="font-semibold">{s.title}</p>
                  </div>
                  {i < STEPS.length - 1 && <span className="ml-auto hidden text-foreground/20 sm:block">→</span>}
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={150}>
            <div className="mx-auto max-w-sm rounded-2xl border border-surface-border bg-surface p-4 shadow-xl">
              <div className="mb-3 flex items-center gap-2 border-b border-surface-border pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zap/15">
                  <MessageCircle size={15} className="text-zap-light" />
                </span>
                <span className="text-sm font-medium">Barbearia do Zé</span>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-zap px-3.5 py-2 text-white">
                  quero cortar cabelo amanhã
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-background px-3.5 py-2 text-foreground/85">
                  Claro, Maria! Temos: 14:30, 15:00 e 16:30 com Júlio
                </div>
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-zap px-3.5 py-2 text-white">15:00</div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-background px-3.5 py-2 text-foreground/85">
                  ✅ Agendado! Pix confirmado. Até amanhã!
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
