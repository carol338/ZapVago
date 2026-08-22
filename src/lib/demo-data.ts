/**
 * Dados 100% fake e hardcoded pra /demo — a demonstração interativa sem
 * cadastro. Nada aqui vem do banco, e nada que a UI da demo fizer com
 * esses dados é persistido (ver src/app/demo/**). As datas dos
 * agendamentos são calculadas relativas a "hoje" pra sempre parecer a
 * semana atual, não importa quando alguém acessa a demo.
 */
import { addDays, setHours, setMinutes, startOfWeek } from "date-fns";

export const DEMO_BUSINESS = {
  name: "Barbearia Exemplo",
  slug: "barbearia-exemplo",
  colorPrimary: "#00A884",
};

export const DEMO_PROFESSIONALS = [
  { id: "prof-julio", name: "Júlio", color: "#10B981" },
  { id: "prof-ana", name: "Ana", color: "#3B82F6" },
  { id: "prof-marcos", name: "Marcos", color: "#F97316" },
];

export const DEMO_SERVICES = [
  { id: "svc-corte", name: "Corte de Cabelo", duration: 30, price: 45 },
  { id: "svc-barba", name: "Barba", duration: 20, price: 30 },
  { id: "svc-combo", name: "Corte + Barba", duration: 50, price: 70 },
  { id: "svc-sobrancelha", name: "Sobrancelha", duration: 15, price: 15 },
  { id: "svc-luzes", name: "Luzes", duration: 90, price: 180 },
];

export const DEMO_CLIENTS = [
  {
    id: "cli-lucas",
    name: "Lucas Andrade",
    phone: "5511999990001",
    tags: ["fiel"],
    totalVisits: 8,
    totalSpent: 360,
    loyaltyPoints: 3,
    predictedNoShowRisk: 0.1,
    lastVisitDaysAgo: 12,
    preferredProfessional: "prof-julio",
    notes: "Prefere corte máquina 1 nas laterais. Sempre traz o filho junto.",
  },
  {
    id: "cli-maria",
    name: "Dona Maria (luzes)",
    phone: "5511999990002",
    tags: ["vip"],
    totalVisits: 8,
    totalSpent: 1440,
    loyaltyPoints: 4,
    predictedNoShowRisk: 0.05,
    lastVisitDaysAgo: 28,
    preferredProfessional: "prof-ana",
    notes: "Sempre faz luzes + corte no mesmo dia. Alérgica a amônia — usar produto sem amônia.",
    alergias: ["amônia"],
  },
  {
    id: "cli-roberto",
    name: "Roberto Lima",
    phone: "5511999990003",
    tags: ["problema"],
    totalVisits: 4,
    totalSpent: 120,
    loyaltyPoints: 4,
    predictedNoShowRisk: 0.65,
    lastVisitDaysAgo: 35,
    preferredProfessional: "prof-julio",
    notes: "Já faltou 2 vezes sem avisar. Exigir confirmação 1h antes.",
  },
  {
    id: "cli-ana",
    name: "Ana Souza",
    phone: "5511999990004",
    tags: ["novo"],
    totalVisits: 1,
    totalSpent: 45,
    loyaltyPoints: 1,
    predictedNoShowRisk: 0.2,
    lastVisitDaysAgo: 5,
    preferredProfessional: "prof-ana",
    notes: "Cliente nova, veio por indicação da Dona Maria.",
  },
  {
    id: "cli-carla",
    name: "Carla Mendes",
    phone: "5511999990005",
    tags: [],
    totalVisits: 3,
    totalSpent: 135,
    loyaltyPoints: 2,
    predictedNoShowRisk: 0.3,
    lastVisitDaysAgo: 18,
    preferredProfessional: "prof-ana",
    notes: "",
  },
  {
    id: "cli-pedro",
    name: "Pedro Ferreira",
    phone: "5511999990006",
    tags: ["sumido"],
    totalVisits: 8,
    totalSpent: 360,
    loyaltyPoints: 3,
    predictedNoShowRisk: 0.4,
    lastVisitDaysAgo: 70,
    preferredProfessional: "prof-julio",
    notes: "Cliente antigo e pontual, mas sumiu há mais de 2 meses. Bom candidato pra feirão.",
  },
  {
    id: "cli-joao",
    name: "João Vitor",
    phone: "5511999990007",
    tags: [],
    totalVisits: 5,
    totalSpent: 135,
    loyaltyPoints: 5,
    predictedNoShowRisk: 0.5,
    lastVisitDaysAgo: 10,
    preferredProfessional: "prof-marcos",
    notes: "Alérgico a látex.",
    alergias: ["látex"],
  },
  {
    id: "cli-mariana",
    name: "Mariana Costa",
    phone: "5511999990008",
    tags: ["vip"],
    totalVisits: 6,
    totalSpent: 540,
    loyaltyPoints: 6,
    predictedNoShowRisk: 0.08,
    lastVisitDaysAgo: 9,
    preferredProfessional: "prof-ana",
    notes: "Elegível pro prêmio de fidelidade — já pode resgatar.",
  },
  {
    id: "cli-felipe",
    name: "Felipe Ramos",
    phone: "5511999990009",
    tags: ["novo"],
    totalVisits: 1,
    totalSpent: 70,
    loyaltyPoints: 1,
    predictedNoShowRisk: 0.25,
    lastVisitDaysAgo: 3,
    preferredProfessional: "prof-marcos",
    notes: "",
  },
  {
    id: "cli-juliana",
    name: "Juliana Alves",
    phone: "5511999990010",
    tags: ["fiel"],
    totalVisits: 10,
    totalSpent: 450,
    loyaltyPoints: 5,
    predictedNoShowRisk: 0.05,
    lastVisitDaysAgo: 15,
    preferredProfessional: "prof-julio",
    notes: "Elegível pro prêmio de fidelidade — já pode resgatar.",
  },
];

/** Segunda-feira da semana atual, 00:00 — base pra todos os horários abaixo. */
const WEEK_START = startOfWeek(new Date(), { weekStartsOn: 1 });

function slot(dayOffset: number, hour: number, minute = 0) {
  return setMinutes(setHours(addDays(WEEK_START, dayOffset), hour), minute);
}

type DemoStatus = "CONFIRMED" | "PENDING_CONFIRMATION" | "COMPLETED" | "NO_SHOW";

interface DemoAppointmentSeed {
  id: string;
  dayOffset: number;
  hour: number;
  minute?: number;
  clientId: string;
  serviceId: string;
  professionalId: string;
  status: DemoStatus;
}

const APPOINTMENTS_SEED: DemoAppointmentSeed[] = [
  { id: "apt-1", dayOffset: 0, hour: 9, clientId: "cli-lucas", serviceId: "svc-corte", professionalId: "prof-julio", status: "COMPLETED" },
  { id: "apt-2", dayOffset: 0, hour: 14, clientId: "cli-maria", serviceId: "svc-luzes", professionalId: "prof-ana", status: "COMPLETED" },
  { id: "apt-3", dayOffset: 1, hour: 10, minute: 30, clientId: "cli-roberto", serviceId: "svc-corte", professionalId: "prof-julio", status: "NO_SHOW" },
  { id: "apt-4", dayOffset: 1, hour: 16, clientId: "cli-ana", serviceId: "svc-corte", professionalId: "prof-ana", status: "COMPLETED" },
  { id: "apt-5", dayOffset: 2, hour: 9, minute: 30, clientId: "cli-joao", serviceId: "svc-combo", professionalId: "prof-marcos", status: "CONFIRMED" },
  { id: "apt-6", dayOffset: 2, hour: 11, clientId: "cli-carla", serviceId: "svc-sobrancelha", professionalId: "prof-ana", status: "CONFIRMED" },
  { id: "apt-7", dayOffset: 2, hour: 15, clientId: "cli-mariana", serviceId: "svc-luzes", professionalId: "prof-ana", status: "CONFIRMED" },
  { id: "apt-8", dayOffset: 3, hour: 10, clientId: "cli-lucas", serviceId: "svc-combo", professionalId: "prof-julio", status: "CONFIRMED" },
  { id: "apt-9", dayOffset: 3, hour: 13, minute: 30, clientId: "cli-felipe", serviceId: "svc-corte", professionalId: "prof-marcos", status: "CONFIRMED" },
  { id: "apt-10", dayOffset: 3, hour: 17, clientId: "cli-juliana", serviceId: "svc-barba", professionalId: "prof-julio", status: "PENDING_CONFIRMATION" },
  { id: "apt-11", dayOffset: 4, hour: 9, clientId: "cli-ana", serviceId: "svc-sobrancelha", professionalId: "prof-ana", status: "CONFIRMED" },
  { id: "apt-12", dayOffset: 4, hour: 14, minute: 30, clientId: "cli-joao", serviceId: "svc-corte", professionalId: "prof-marcos", status: "CONFIRMED" },
  { id: "apt-13", dayOffset: 4, hour: 16, clientId: "cli-pedro", serviceId: "svc-combo", professionalId: "prof-julio", status: "PENDING_CONFIRMATION" },
  { id: "apt-14", dayOffset: 5, hour: 10, clientId: "cli-mariana", serviceId: "svc-corte", professionalId: "prof-ana", status: "CONFIRMED" },
  { id: "apt-15", dayOffset: 5, hour: 13, clientId: "cli-juliana", serviceId: "svc-luzes", professionalId: "prof-julio", status: "CONFIRMED" },
];

export const DEMO_APPOINTMENTS = APPOINTMENTS_SEED.map((a) => {
  const service = DEMO_SERVICES.find((s) => s.id === a.serviceId)!;
  const client = DEMO_CLIENTS.find((c) => c.id === a.clientId)!;
  const professional = DEMO_PROFESSIONALS.find((p) => p.id === a.professionalId)!;
  const date = slot(a.dayOffset, a.hour, a.minute ?? 0);
  const endTime = new Date(date.getTime() + service.duration * 60000);
  return { ...a, date, endTime, service, client, professional };
});

export const DEMO_CONVERSATIONS = [
  {
    id: "conv-1",
    clientId: "cli-ana",
    clientName: "Ana Souza",
    clientPhone: "5511999990004",
    status: "RESOLVED" as const,
    sentiment: "positive" as const,
    needsAttention: false,
    summary: "Cliente agendou corte para quinta-feira às 9h.",
    minutesAgo: 18,
    messages: [
      { role: "client" as const, content: "oi! vcs tem horário quinta de manhã?", sentiment: "positive" },
      { role: "bot" as const, content: "Oi, Ana! 💈 Tenho sim, 9h com a Ana ficou bom pra você?", sentiment: "neutral" },
      { role: "client" as const, content: "perfeito, pode marcar! obrigada", sentiment: "positive" },
      { role: "bot" as const, content: "Marcado! Corte de Cabelo, quinta às 9h com a Ana. Te mando um lembrete um dia antes 🙂", sentiment: "neutral" },
    ],
  },
  {
    id: "conv-2",
    clientId: "cli-roberto",
    clientName: "Roberto Lima",
    clientPhone: "5511999990003",
    status: "NEEDS_HUMAN" as const,
    sentiment: "negative" as const,
    needsAttention: true,
    summary: "Cliente reclamou de ter esperado 30 minutos.",
    minutesAgo: 6,
    messages: [
      { role: "client" as const, content: "esperei 30 minutos pra ser atendido ontem, isso não é a primeira vez", sentiment: "negative" },
      { role: "bot" as const, content: "Poxa, sinto muito pela demora 😕 Vou chamar o dono pra te ajudar agora mesmo.", sentiment: "neutral" },
    ],
  },
  {
    id: "conv-3",
    clientId: "cli-mariana",
    clientName: "Mariana Costa",
    clientPhone: "5511999990008",
    status: "BOT_HANDLING" as const,
    sentiment: "neutral" as const,
    needsAttention: false,
    summary: "Cliente perguntou sobre o prêmio de fidelidade.",
    minutesAgo: 32,
    messages: [
      { role: "client" as const, content: "eu já tenho direito ao brinde de fidelidade?", sentiment: "neutral" },
      { role: "bot" as const, content: "Deixa eu ver aqui... sim! Você já bateu as 5 visitas e tem direito a uma Barba grátis 🎁 Quer que eu já gere o link pra agendar?", sentiment: "neutral" },
    ],
  },
];

export const DEMO_LOYALTY_RULE = {
  id: "loy-1",
  visitsRequired: 5,
  rewardServiceId: "svc-barba",
  rewardDiscount: 100,
};

export const DEMO_REPORTS = {
  weekly: [
    { dia: "Seg", faturamento: 90 },
    { dia: "Ter", faturamento: 45 },
    { dia: "Qua", faturamento: 200 },
    { dia: "Qui", faturamento: 265 },
    { dia: "Sex", faturamento: 190 },
    { dia: "Sáb", faturamento: 250 },
    { dia: "Dom", faturamento: 0 },
  ],
  professionals: [
    { nome: "Júlio", faturamento: 420 },
    { nome: "Ana", faturamento: 465 },
    { nome: "Marcos", faturamento: 145 },
  ],
  services: [
    { nome: "Corte de Cabelo", quantidade: 6 },
    { nome: "Luzes", quantidade: 3 },
    { nome: "Corte + Barba", quantidade: 3 },
    { nome: "Sobrancelha", quantidade: 2 },
    { nome: "Barba", quantidade: 1 },
  ],
  sentiment: { positivos: 6, neutros: 3, negativos: 1, tendencia: "melhorou" as const },
  monthlyMessage:
    "📊 ZAPVAGO - RECEITA DO MÊS\nBarbearia Exemplo - agosto/2026\n\n💰 Faturamento: R$ 1.030,00\n📅 Agendamentos: 15\n✅ Comparecimentos: 13 (87%)\n❌ Faltas: 1 (7%)\n📆 Remarcações: 1 (7%)\n\n🏆 Profissional do mês: Ana (31% dos agendamentos)\n⭐ Cliente do mês: Mariana Costa (2 visitas, R$115,00 gasto)\n\n💡 Sugestões:\n• Criar Feirão pra preencher horários de terça\n• Mandar mensagem pro Pedro Ferreira, sumido há 70 dias",
};
