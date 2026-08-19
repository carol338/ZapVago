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
            <h2 className="mb-2 text-lg font-semibold text-foreground">5. Responsabilidades do dono do negócio</h2>
            <p>
              Ao usar o ZapVago para atender seus clientes, você é o controlador dos dados pessoais deles (LGPD, Art.
              5º, VI) — cabe a você garantir uma base legal para tratá-los (em geral, o consentimento implícito no
              agendamento) e responder a pedidos desses clientes sobre seus próprios dados. Você também é responsável
              por manter suas credenciais de acesso (senha, token do WhatsApp) em sigilo, por manter as informações
              do negócio atualizadas e por usar a plataforma de acordo com as políticas da Meta/WhatsApp Business e
              do Mercado Pago.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">6. Responsabilidades do ZapVago</h2>
            <p>
              O ZapVago atua como operador dos dados pessoais dos clientes finais que você cadastra (LGPD, Art. 5º,
              VII), tratando-os apenas conforme suas instruções e para operar a plataforma. Nos comprometemos a
              manter a infraestrutura com práticas razoáveis de segurança, disponibilizar os mecanismos de acesso e
              exclusão de dados descritos na Política de Privacidade, e notificar você em caso de incidente de
              segurança relevante envolvendo os dados do seu negócio.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">7. Limitações de uso e de responsabilidade</h2>
            <p>
              O ZapVago é fornecido &quot;como está&quot;. Não garantimos disponibilidade ininterrupta do serviço e
              não nos responsabilizamos por perdas indiretas decorrentes de indisponibilidade temporária, de falhas
              de terceiros (Meta/WhatsApp, Mercado Pago) ou de uso indevido da plataforma pelo dono do negócio ou por
              terceiros com acesso à sua conta.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">8. Política de cancelamento</h2>
            <p>
              Você pode cancelar sua assinatura a qualquer momento, diretamente nas configurações da conta, sem
              multa — o acesso continua disponível até o fim do período já pago. Ao cancelar, você pode exportar
              todos os dados do negócio antes de excluir a conta (veja a Política de Privacidade); a exclusão da
              conta e de todos os dados associados também pode ser feita a qualquer momento pelo painel, em
              Configurações → Privacidade e dados.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">9. Contato</h2>
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
