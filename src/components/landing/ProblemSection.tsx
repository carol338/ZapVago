import { Card } from "@/components/ui/card";
import { Clock, UserX, CalendarX2 } from "lucide-react";
import { FadeIn } from "./FadeIn";

const DORES = [
  {
    icon: Clock,
    title: "Horas perdidas no WhatsApp",
    points: ["Cada agendamento manual leva 10-15 minutos", "Você responde mensagens em vez de atender clientes"],
  },
  {
    icon: UserX,
    title: "Clientes que desistem",
    points: ["50% dos clientes desistem se não recebem resposta em 5 minutos", "Cada horário vago é dinheiro perdido"],
  },
  {
    icon: CalendarX2,
    title: "Faltas sem controle",
    points: ["20% dos agendamentos viram faltas", "Sem pagamento antecipado, você não tem garantia"],
  },
];

export function ProblemSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <FadeIn>
        <h2 className="text-center text-3xl font-bold sm:text-4xl">Você está perdendo dinheiro todos os dias</h2>
      </FadeIn>
      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {DORES.map((d, i) => (
          <FadeIn key={d.title} delay={i * 100} direction={i % 2 === 0 ? "left" : "right"}>
            <Card className="h-full transition-transform duration-200 hover:scale-[1.02]">
              <d.icon className="mb-3 text-risk-high" size={26} />
              <h3 className="mb-2 font-semibold">{d.title}</h3>
              <ul className="space-y-1.5 text-sm text-foreground/60">
                {d.points.map((p) => (
                  <li key={p}>• {p}</li>
                ))}
              </ul>
            </Card>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
