import { Check, X } from "lucide-react";
import { FadeIn } from "./FadeIn";

const LINHAS = [
  { nome: "Agendamento automático", papel: false, chatbot: true, zapvago: true },
  { nome: "Pagamento antecipado", papel: false, chatbot: false, zapvago: true },
  { nome: "Previsão de faltas", papel: false, chatbot: false, zapvago: true },
  { nome: "Prontuário inteligente", papel: false, chatbot: false, zapvago: true },
  { nome: "Lista de espera ativa", papel: false, chatbot: false, zapvago: true },
  { nome: "Relatório automático", papel: false, chatbot: false, zapvago: true },
  { nome: "Fidelidade automática", papel: false, chatbot: false, zapvago: true },
  { nome: "Sentimento dos clientes", papel: false, chatbot: false, zapvago: true },
];

function Mark({ ok, delay }: { ok: boolean; delay: number }) {
  return (
    <FadeIn delay={delay} className="flex justify-center">
      {ok ? <Check size={17} className="text-zap-light" /> : <X size={17} className="text-foreground/25" />}
    </FadeIn>
  );
}

export function ComparisonTable() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20">
      <FadeIn>
        <h2 className="text-center text-3xl font-bold sm:text-4xl">Por que o ZapVago é diferente</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-foreground/60">
          Agenda de papel e chatbot genérico resolvem só uma parte. O ZapVago resolve tudo.
        </p>
      </FadeIn>

      <FadeIn delay={100} className="mt-10 overflow-x-auto rounded-xl border border-surface-border">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface text-left">
              <th className="p-4 font-medium text-foreground/60">Funcionalidade</th>
              <th className="p-4 text-center font-medium text-foreground/60">Agenda de Papel</th>
              <th className="p-4 text-center font-medium text-foreground/60">Chatbot Comum</th>
              <th className="rounded-t-lg bg-zap/10 p-4 text-center font-semibold text-zap-light">ZapVago</th>
            </tr>
          </thead>
          <tbody>
            {LINHAS.map((l, i) => (
              <tr key={l.nome} className="border-b border-surface-border last:border-0">
                <td className="p-4 text-foreground/80">{l.nome}</td>
                <td className="p-4">
                  <Mark ok={l.papel} delay={i * 40} />
                </td>
                <td className="p-4">
                  <Mark ok={l.chatbot} delay={i * 40 + 20} />
                </td>
                <td className="bg-zap/[0.06] p-4">
                  <Mark ok={l.zapvago} delay={i * 40 + 40} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </FadeIn>
    </section>
  );
}
