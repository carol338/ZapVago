import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MessageCircle,
  Brain,
  Users,
  TrendingUp,
  Zap,
  Globe,
  Heart,
  BarChart3,
  ShieldAlert,
  CalendarClock,
} from "lucide-react";

const DIFERENCIAIS = [
  { icon: Brain, title: "Prontuário Inteligente", desc: "O bot lembra histórico, preferências e alergias de cada cliente." },
  { icon: CalendarClock, title: "Lista de Espera Ativa", desc: "Cancelou? O horário é oferecido automaticamente para a fila." },
  { icon: TrendingUp, title: "Pré-Venda Inteligente", desc: "Sugestões de combos e serviços complementares na hora de agendar." },
  { icon: Heart, title: "Painel de Sentimentos", desc: "Analisa o tom das conversas e alerta sobre clientes insatisfeitos." },
  { icon: ShieldAlert, title: "Previsão de Faltas", desc: "Calcula a probabilidade de no-show com base no histórico." },
  { icon: Zap, title: "Modo Feirão", desc: "Ofertas relâmpago automáticas para preencher horários ociosos." },
  { icon: BarChart3, title: "Receita do Mês", desc: "Relatório automático com indicadores vitais direto no seu WhatsApp." },
  { icon: Globe, title: "Multilíngue", desc: "Detecta o idioma do cliente e responde na língua dele." },
  { icon: Users, title: "Fidelidade Automática", desc: "Sistema de recompensas por visitas, sem esforço manual." },
];

const PLANOS = [
  { nome: "Grátis", preco: "R$ 0", periodo: "/mês", features: ["50 agendamentos/mês", "1 profissional", "WhatsApp básico", "7 dias de histórico"] },
  { nome: "Pro", preco: "R$ 147", periodo: "/mês", destaque: true, features: ["Agendamentos ilimitados", "5 profissionais", "Lembretes automáticos", "Lista de espera", "Fidelidade básico"] },
  { nome: "Business", preco: "R$ 297", periodo: "/mês", features: ["Profissionais ilimitados", "Feirões", "Painel de sentimentos", "Previsão de faltas", "Relatórios avançados", "Multilíngue", "Fidelidade premium"] },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-surface-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="text-zap" size={24} />
            <span className="text-lg font-bold">ZapVago</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Entrar</Button></Link>
            <Link href="/register"><Button size="sm">Começar grátis</Button></Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <span className="mb-4 inline-block rounded-full bg-zap/10 px-3 py-1 text-xs font-medium text-zap-light">
          Feito para o pequeno empresário brasileiro
        </span>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          Seu assistente proativo de agendamento, direto no WhatsApp
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-foreground/70">
          O ZapVago não é só um agendador. Ele lembra preferências, prevê faltas, faz upsell,
          preenche horários vagos e entrega inteligência de negócio — tudo automático, no WhatsApp.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/register"><Button size="lg">Criar minha conta grátis</Button></Link>
          <Link href="#diferenciais"><Button variant="secondary" size="lg">Ver diferenciais</Button></Link>
        </div>
      </section>

      {/* Diferenciais */}
      <section id="diferenciais" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-2 text-center text-2xl font-bold">Diferenciais competitivos</h2>
        <p className="mb-10 text-center text-foreground/60">Tudo isso já vem pronto, sem configuração complicada.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DIFERENCIAIS.map((d) => (
            <Card key={d.title}>
              <d.icon className="mb-3 text-zap" size={22} />
              <h3 className="mb-1 font-semibold">{d.title}</h3>
              <p className="text-sm text-foreground/60">{d.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="mb-10 text-center text-2xl font-bold">Planos e preços</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PLANOS.map((p) => (
            <Card key={p.nome} className={p.destaque ? "border-zap ring-1 ring-zap" : ""}>
              <h3 className="text-lg font-semibold">{p.nome}</h3>
              <p className="mt-2 text-3xl font-bold">
                {p.preco}
                <span className="text-base font-normal text-foreground/50">{p.periodo}</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-foreground/70">
                {p.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <Link href="/register" className="mt-6 block">
                <Button variant={p.destaque ? "primary" : "secondary"} className="w-full">Escolher {p.nome}</Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold">Perguntas frequentes</h2>
        <div className="space-y-4">
          {[
            ["Preciso ter WhatsApp Business?", "Sim, conectamos via API oficial do WhatsApp Business (Meta), com QR Code simples no onboarding."],
            ["Funciona para qualquer tipo de negócio de serviços?", "Sim — barbearias, salões, clínicas, manicures, pet shops, estúdios de tatuagem e mais."],
            ["Posso cancelar quando quiser?", "Sim, sem fidelidade. Você pode fazer downgrade para o plano grátis a qualquer momento."],
          ].map(([q, a]) => (
            <Card key={q}>
              <h3 className="font-semibold">{q}</h3>
              <p className="mt-1 text-sm text-foreground/60">{a}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-surface-border py-8 text-center text-sm text-foreground/40">
        © {new Date().getFullYear()} ZapVago. O copiloto de verdade do pequeno empresário.
      </footer>
    </main>
  );
}
