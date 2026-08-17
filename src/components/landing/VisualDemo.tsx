import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { FadeIn } from "./FadeIn";

const AGENDA_ROWS = [
  { time: "09:00", name: "João", dot: "🟩" },
  { time: "09:30", name: "Livre", dot: null },
  { time: "10:00", name: "Maria", dot: "🟦", risk: true },
  { time: "10:30", name: "Pedro", dot: "🟪" },
];

const HORARIOS = ["09:00", "10:00", "11:00"];

export function VisualDemo() {
  return (
    <section id="demonstracao" className="mx-auto max-w-6xl px-4 py-20">
      <FadeIn>
        <h2 className="text-center text-3xl font-bold sm:text-4xl">Veja o ZapVago em ação</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-foreground/60">
          Três telas. Zero trabalho manual. Agenda lotada.
        </p>
      </FadeIn>

      <div className="mt-12 flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
        {/* Card 1 — Agenda Inteligente */}
        <FadeIn className="flex-1">
          <Card className="h-full transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(0,168,132,0.15)]">
            <h3 className="mb-3 font-semibold">Agenda Inteligente</h3>
            <div className="rounded-lg bg-background p-3 text-xs">
              <p className="mb-2 text-[10px] font-semibold tracking-wide text-foreground/40">AGENDA DO DIA</p>
              <div className="mb-3 flex items-center gap-4">
                <span className="font-semibold text-zap-light">💰 R$ 890</span>
                <span className="text-foreground/60">📅 8 agendados</span>
              </div>
              <div className="space-y-1.5">
                {AGENDA_ROWS.map((r) => (
                  <div
                    key={r.time}
                    className={`flex items-center justify-between rounded px-2 py-1.5 ${r.dot ? "bg-surface" : "border border-dashed border-surface-border"}`}
                  >
                    <span className="text-foreground/50">{r.time}</span>
                    <span className={r.dot ? "font-medium" : "text-foreground/30"}>{r.name}</span>
                    <span className="flex w-8 items-center justify-end gap-1">
                      {r.dot}
                      {r.risk && <span title="Risco de falta">⚠️</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-sm text-foreground/60">
              Sua agenda organizada com previsão de faltas e faturamento em tempo real
            </p>
          </Card>
        </FadeIn>

        <ChevronRight size={22} className="mx-auto hidden shrink-0 text-foreground/20 lg:block" />

        {/* Card 2 — Conversa no WhatsApp */}
        <FadeIn delay={100} className="flex-1">
          <Card className="h-full transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(0,168,132,0.15)]">
            <h3 className="mb-3 font-semibold">Conversa no WhatsApp</h3>
            <div className="rounded-lg bg-background p-3">
              <p className="mb-2 text-[10px] font-semibold tracking-wide text-foreground/40">WHATSAPP</p>
              <div className="space-y-1.5 text-xs">
                <div className="max-w-[80%] rounded-xl rounded-tl-sm bg-surface px-2.5 py-1.5 text-foreground/80">
                  quero cortar
                </div>
                <div className="ml-auto max-w-[80%] rounded-xl rounded-tr-sm bg-zap px-2.5 py-1.5 text-white">
                  Claro! Temos: 14:30, 15:00
                </div>
                <div className="max-w-[80%] rounded-xl rounded-tl-sm bg-surface px-2.5 py-1.5 text-foreground/80">
                  15:00
                </div>
                <div className="ml-auto max-w-[80%] rounded-xl rounded-tr-sm bg-zap px-2.5 py-1.5 text-white">
                  ✅ Agendado! Pix confirmado
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-foreground/60">
              Seu cliente agenda sozinho em 3 mensagens. Sem você digitar uma palavra.
            </p>
          </Card>
        </FadeIn>

        <ChevronRight size={22} className="mx-auto hidden shrink-0 text-foreground/20 lg:block" />

        {/* Card 3 — Página de Agendamento */}
        <FadeIn delay={200} className="flex-1">
          <Card className="h-full transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(0,168,132,0.15)]">
            <h3 className="mb-3 font-semibold">Página de Agendamento</h3>
            <div className="rounded-lg bg-background p-3 text-xs">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold tracking-wide text-foreground/40">BEAUTY STUDIO</p>
                <span className="text-foreground/60">⭐ 4.9</span>
              </div>
              <p className="text-foreground/70">
                Serviço: <span className="font-medium text-foreground">Luzes</span>
              </p>
              <p className="mb-3 text-foreground/70">
                Profissional: <span className="font-medium text-foreground">Ana</span>
              </p>
              <p className="mb-1.5 text-foreground/50">Horários:</p>
              <div className="mb-3 flex gap-1.5">
                {HORARIOS.map((h, i) => (
                  <span
                    key={h}
                    className={`rounded-md border px-2 py-1 ${i === 0 ? "border-zap bg-zap/15 text-zap-light" : "border-surface-border text-foreground/60"}`}
                  >
                    {h}
                  </span>
                ))}
              </div>
              <p className="mb-2 text-foreground/60">💳 Pix (5% off)</p>
              <div className="flex h-9 w-full items-center justify-center rounded-lg bg-zap text-xs font-semibold text-white">
                CONFIRMAR
              </div>
            </div>
            <p className="mt-3 text-sm text-foreground/60">
              Página personalizada com sua marca. Cliente agenda e paga na hora.
            </p>
          </Card>
        </FadeIn>
      </div>
    </section>
  );
}
