import { Card } from "@/components/ui/card";
import {
  Brain,
  Send,
  CreditCard,
  ShieldAlert,
  Smile,
  Zap,
  Gift,
  Globe,
  BarChart3,
  Bell,
  VolumeX,
  Palette,
} from "lucide-react";
import { FadeIn } from "./FadeIn";

const DIFERENCIAIS = [
  { icon: Brain, title: "Prontuário Inteligente", desc: "Lembra preferências, alergias e periodicidade" },
  { icon: Send, title: "Lista de Espera Ativa", desc: "Cancelou? O horário é preenchido automaticamente" },
  { icon: CreditCard, title: "Pagamento Antecipado", desc: "Pix e cartão integrados. Faltas caem 80%" },
  { icon: ShieldAlert, title: "Previsão de Faltas", desc: "Saiba quem vai faltar antes que falte" },
  { icon: Smile, title: "Painel de Sentimentos", desc: "Clientes insatisfeitos? Você fica sabendo" },
  { icon: Zap, title: "Modo Feirão", desc: "Ofertas relâmpago para preencher horários vagos" },
  { icon: Gift, title: "Fidelidade Automática", desc: "A cada 5 cortes, 1 grátis" },
  { icon: Globe, title: "Multilíngue", desc: "Atende turistas em 6 idiomas" },
  { icon: BarChart3, title: "Receita do Mês", desc: "Relatório automático no seu WhatsApp" },
  { icon: Bell, title: "Notificações em Tempo Real", desc: "Saiba na hora quando alguém agenda" },
  { icon: VolumeX, title: "Modo Silencioso", desc: "Clientes problemáticos são gerenciados sozinhos" },
  { icon: Palette, title: "Página Personalizada", desc: "Sua marca, seu link, sua vitrine" },
];

export function Differentials() {
  return (
    <section id="diferenciais" className="mx-auto max-w-6xl px-4 py-20">
      <FadeIn>
        <h2 className="text-center text-3xl font-bold sm:text-4xl">12 diferenciais que fazem a diferença</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-foreground/60">
          Tudo isso já vem pronto, sem configuração complicada.
        </p>
      </FadeIn>
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DIFERENCIAIS.map((d, i) => (
          <FadeIn key={d.title} delay={(i % 3) * 80}>
            <Card className="h-full transition-transform duration-200 hover:scale-[1.02]">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-zap/10 text-zap-light">
                <d.icon size={20} />
              </span>
              <h3 className="mb-1 font-semibold">{d.title}</h3>
              <p className="text-sm text-foreground/60">{d.desc}</p>
            </Card>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
