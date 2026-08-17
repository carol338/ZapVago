import Link from "next/link";
import { MessageCircle, ArrowLeft } from "lucide-react";

export const metadata = { title: "Termos de Uso — ZapVago" };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-surface-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <MessageCircle className="text-zap" size={20} />
            <span className="font-bold">ZapVago</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground">
            <ArrowLeft size={15} /> Voltar
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">Termos de Uso</h1>
        <p className="mt-2 text-sm text-foreground/50">Última atualização: agosto de 2026</p>

        <div className="mt-6 rounded-lg border border-risk-mid/30 bg-risk-mid/10 p-4 text-sm text-risk-mid">
          Este é um documento inicial de referência e ainda não foi revisado por um advogado. Não publique como
          termos definitivos sem essa revisão.
        </div>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/80">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">1. Sobre o ZapVago</h2>
            <p>
              O ZapVago é uma plataforma de agendamento para negócios de serviços, que se comunica com os clientes
              finais via WhatsApp e permite gestão de agenda, cobrança e fidelização.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">2. Teste grátis e assinatura</h2>
            <p>
              Novas contas têm acesso a um período de teste gratuito, sem necessidade de cartão de crédito. Ao final
              do teste, a continuidade do uso está sujeita à contratação de um dos planos pagos disponíveis. O
              cancelamento pode ser feito a qualquer momento, diretamente nas configurações da conta, sem multa.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">3. Pagamentos</h2>
            <p>
              Pagamentos feitos pelos clientes finais (Pix ou cartão) são processados por um provedor terceiro
              (Mercado Pago). O ZapVago não armazena dados completos de cartão de crédito.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">4. Uso aceitável</h2>
            <p>
              O uso da plataforma para envio de mensagens não solicitadas, spam, ou qualquer atividade que viole as
              políticas da Meta/WhatsApp Business é proibido e pode levar à suspensão da conta.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">5. Limitação de responsabilidade</h2>
            <p>
              O ZapVago é fornecido &quot;como está&quot;. Não garantimos disponibilidade ininterrupta do serviço e
              não nos responsabilizamos por perdas indiretas decorrentes de indisponibilidade temporária.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">6. Contato</h2>
            <p>
              Dúvidas sobre estes termos podem ser enviadas para{" "}
              <a href="mailto:contato@zapvago.app" className="text-zap-light hover:underline">
                contato@zapvago.app
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
