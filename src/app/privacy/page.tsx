import Link from "next/link";
import { MessageCircle, ArrowLeft } from "lucide-react";

export const metadata = { title: "Política de Privacidade — ZapVago" };

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-foreground/50">Última atualização: agosto de 2026</p>

        <div className="mt-6 rounded-lg border border-risk-mid/30 bg-risk-mid/10 p-4 text-sm text-risk-mid">
          Este é um documento inicial de referência e ainda não foi revisado por um advogado. Não publique como
          política definitiva sem essa revisão e sem confirmar as práticas reais de dados do negócio.
        </div>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/80">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">1. Quais dados coletamos</h2>
            <p>
              Do dono do negócio: nome, e-mail, telefone e dados do negócio (serviços, horários, profissionais). Dos
              clientes finais: nome, telefone e histórico de agendamentos, usados para o assistente de WhatsApp
              funcionar (lembrar preferências, confirmar horários, processar pagamentos).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">2. Como usamos os dados</h2>
            <p>
              Os dados são usados exclusivamente para operar a agenda, enviar mensagens automáticas pelo WhatsApp
              Business e processar pagamentos via Mercado Pago. Não vendemos dados de clientes a terceiros.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">3. Seus direitos (LGPD)</h2>
            <p>
              Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento, entrando em contato
              pelo e-mail abaixo.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">4. Segurança</h2>
            <p>
              Os dados trafegam de forma criptografada (HTTPS) e ficam armazenados em banco de dados com acesso
              restrito à equipe do ZapVago.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">5. Contato</h2>
            <p>
              Solicitações relacionadas a dados pessoais podem ser enviadas para{" "}
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
