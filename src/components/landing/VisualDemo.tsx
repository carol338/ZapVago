import { Card } from "@/components/ui/card";
import { Calendar, Store, BarChart3, MessageCircle } from "lucide-react";
import { FadeIn } from "./FadeIn";

export function VisualDemo() {
  return (
    <section id="demonstracao" className="mx-auto max-w-6xl px-4 py-20">
      <FadeIn>
        <h2 className="text-center text-3xl font-bold sm:text-4xl">Veja o ZapVago por dentro</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-foreground/60">
          Painel completo pra você, vitrine bonita pro seu cliente.
        </p>
      </FadeIn>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FadeIn>
          <Card className="h-full">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground/70">
              <Calendar size={16} className="text-zap-light" /> Planilha de agenda
            </div>
            <div className="space-y-1.5 text-xs">
              {[
                { color: "#00A884", time: "09:00", name: "Maria Silva", service: "Corte + Escova" },
                { color: "#3B82F6", time: "10:30", name: "João Pedro", service: "Barba" },
                { color: "#F59E0B", time: "14:00", name: "Ana Costa", service: "Hidratação" },
                { color: "#00A884", time: "16:30", name: "Rafael Souza", service: "Corte" },
              ].map((r) => (
                <div key={r.time} className="flex items-center justify-between gap-2 rounded bg-background px-2.5 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-1 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-foreground/50">{r.service}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-foreground/50">{r.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={80}>
          <Card className="h-full">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground/70">
              <Store size={16} className="text-zap-light" /> Página pública de agendamento
            </div>
            <div className="rounded-lg bg-background p-3">
              <div className="mb-3 flex h-16 flex-col justify-center rounded-lg bg-gradient-to-br from-zap/30 to-zap/5 px-3">
                <p className="text-sm font-semibold">Barbearia do Zé</p>
                <p className="text-xs text-foreground/60">Corte, barba e muito mais</p>
              </div>
              <p className="mb-1 text-xs font-medium text-foreground/70">Escolha um serviço</p>
              <p className="mb-3 text-xs text-foreground/50">Corte de Cabelo · 30min · R$ 45,00</p>
              <div className="flex h-9 w-full items-center justify-center rounded-lg bg-zap text-xs font-semibold text-white">
                Agendar agora
              </div>
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={160}>
          <Card className="h-full">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground/70">
              <BarChart3 size={16} className="text-zap-light" /> Painel de relatórios
            </div>
            <div className="flex h-24 items-end gap-2 rounded-lg bg-background p-3">
              {[40, 70, 55, 90, 65, 80].map((h, i) => (
                <span key={i} className="flex-1 rounded-t bg-zap/60" style={{ height: `${h}%` }} />
              ))}
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={240}>
          <Card className="h-full">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground/70">
              <MessageCircle size={16} className="text-zap-light" /> Conversas do WhatsApp
            </div>
            <div className="space-y-2 text-xs">
              <div className="max-w-[75%] rounded-xl rounded-tl-sm bg-background px-2.5 py-1.5 text-foreground/80">
                Oi! Vocês atendem sábado?
              </div>
              <div className="ml-auto max-w-[75%] rounded-xl rounded-tr-sm bg-zap px-2.5 py-1.5 text-white">
                Atendemos sim! Temos horário às 10h 😊
              </div>
            </div>
          </Card>
        </FadeIn>
      </div>
    </section>
  );
}
