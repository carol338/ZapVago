/**
 * Seed do ZapVago — cria um negócio de barbearia fake para testes,
 * com serviços, profissionais, clientes, agendamentos, conversas
 * (Bloco 2 — Inteligência: prontuário, no-show, sentimentos).
 *
 * Rodar com: npm run db:seed
 */
import { PrismaClient, Category, Status, Source, Plan } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, addMinutes, subDays, setHours, setMinutes } from "date-fns";

const prisma = new PrismaClient();

// Mesma fórmula de src/lib/noshow.ts — duplicada aqui pra não depender de
// resolução de path alias no script de seed (tsx roda fora do Next).
function calcRisk(client: { noShowCount: number; totalVisits: number; cancelLateCount: number; lastVisitAt: Date | null }, clientConfirmed: boolean) {
  const visits = Math.max(client.totalVisits, 1);
  let risco = 0;
  risco += (client.noShowCount / visits) * 0.4;
  risco += (client.cancelLateCount / visits) * 0.2;
  risco += clientConfirmed ? 0 : 0.3;
  const dias = client.lastVisitAt ? Math.floor((Date.now() - client.lastVisitAt.getTime()) / 86400000) : 999;
  if (dias > 30) risco += 0.1;
  return Math.min(1, Math.round(risco * 100) / 100);
}

async function main() {
  console.log("Limpando dados antigos...");
  await prisma.clientNote.deleteMany();
  await prisma.bookingToken.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.waitingListEntry.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.flashSale.deleteMany();
  await prisma.loyaltyRule.deleteMany();
  await prisma.silentRule.deleteMany();
  await prisma.client.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.service.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.business.deleteMany();

  console.log("Criando negócio (Barbearia do Zé)...");
  const business = await prisma.business.create({
    data: {
      name: "Barbearia do Zé",
      slug: "barbearia-do-ze",
      plan: Plan.BUSINESS,
      category: Category.BARBER,
      phone: "5511988887777",
      address: "Rua das Tesouras, 123 - São Paulo, SP",
      timezone: "America/Sao_Paulo",
      whatsappConnected: true,
      settings: {
        workingHours: {
          mon: { start: "09:00", end: "19:00" },
          tue: { start: "09:00", end: "19:00" },
          wed: { start: "09:00", end: "19:00" },
          thu: { start: "09:00", end: "19:00" },
          fri: { start: "09:00", end: "20:00" },
          sat: { start: "09:00", end: "17:00" },
          sun: null,
        },
        blockedSlots: [
          { day: "mon", start: "12:00", end: "13:00", label: "Almoço" },
          { day: "tue", start: "12:00", end: "13:00", label: "Almoço" },
          { day: "wed", start: "12:00", end: "13:00", label: "Almoço" },
          { day: "thu", start: "12:00", end: "13:00", label: "Almoço" },
          { day: "fri", start: "12:00", end: "13:00", label: "Almoço" },
        ],
        slotDuration: 30,
        reminderHours: [24, 1],
        autoConfirm: true,
        allowCancel: true,
        cancelDeadlineHours: 4,
        language: "pt-BR",
        timezone: "America/Sao_Paulo",
        infoExtras: { estacionamento: true, aceitaCartao: true, aceitaPix: true },
      },
    },
  });

  console.log("Criando dono...");
  const hashedPassword = await bcrypt.hash("senha123", 10);
  await prisma.owner.create({
    data: {
      businessId: business.id,
      name: "Zé Carlos",
      email: "ze@barbeariadoze.com.br",
      password: hashedPassword,
      phone: "5511988887777",
      notifyOn: {
        newAppointment: true,
        dailyReport: false,
        weeklyReport: true,
        sentimentAlert: true,
        channel: "whatsapp",
      },
    },
  });

  console.log("Criando serviços...");
  const corte = await prisma.service.create({
    data: {
      businessId: business.id,
      name: "Corte de Cabelo",
      duration: 30,
      price: 45,
      color: "#4F46E5",
      category: "cabelo",
      order: 1,
    },
  });
  const barba = await prisma.service.create({
    data: {
      businessId: business.id,
      name: "Barba",
      duration: 20,
      price: 30,
      color: "#F59E0B",
      category: "barba",
      order: 2,
    },
  });
  const corteBarba = await prisma.service.create({
    data: {
      businessId: business.id,
      name: "Corte + Barba",
      duration: 50,
      price: 70,
      color: "#00A884",
      category: "cabelo",
      order: 3,
      comboOf: [corte.id, barba.id],
      comboDiscount: 12.5,
    },
  });
  const sobrancelha = await prisma.service.create({
    data: {
      businessId: business.id,
      name: "Sobrancelha",
      duration: 15,
      price: 15,
      color: "#8B5CF6",
      category: "cabelo",
      order: 4,
    },
  });
  const hidratacao = await prisma.service.create({
    data: {
      businessId: business.id,
      name: "Hidratação",
      duration: 25,
      price: 40,
      color: "#EC4899",
      category: "cabelo",
      order: 5,
    },
  });
  const luzes = await prisma.service.create({
    data: {
      businessId: business.id,
      name: "Luzes",
      duration: 90,
      price: 180,
      color: "#EAB308",
      category: "cabelo",
      order: 6,
    },
  });

  console.log("Criando profissionais...");
  const julio = await prisma.professional.create({
    data: {
      businessId: business.id,
      name: "Júlio",
      color: "#10B981",
      serviceIds: [corte.id, barba.id, corteBarba.id, sobrancelha.id, hidratacao.id],
    },
  });
  const ana = await prisma.professional.create({
    data: {
      businessId: business.id,
      name: "Ana",
      color: "#3B82F6",
      serviceIds: [corte.id, sobrancelha.id, hidratacao.id, luzes.id],
    },
  });
  const marcos = await prisma.professional.create({
    data: {
      businessId: business.id,
      name: "Marcos",
      color: "#F97316",
      serviceIds: [corte.id, barba.id, corteBarba.id],
    },
  });

  console.log("Criando regra de fidelidade...");
  await prisma.loyaltyRule.create({
    data: {
      businessId: business.id,
      visitsRequired: 5,
      rewardServiceId: barba.id,
      rewardDiscount: 100,
    },
  });

  console.log("Criando regras de modo silencioso...");
  await prisma.silentRule.createMany({
    data: [
      { businessId: business.id, trigger: "noshow_3x", action: "require_prepayment" },
      { businessId: business.id, trigger: "price_asked_3x_no_book", action: "silence_offers_30d" },
      { businessId: business.id, trigger: "late_cancel_2x", action: "require_confirmation" },
    ],
  });

  console.log("Criando clientes...");
  const clientsData = [
    {
      key: "lucas",
      name: "Lucas Andrade",
      phone: "5511999990001",
      tags: ["fiel"],
      totalVisits: 8,
      totalSpent: 360,
      avgIntervalDays: 21,
      noShowCount: 0,
      loyaltyPoints: 3,
      preferencias: { professionalPreference: julio.id, bestDays: ["tue", "thu"], bestTimes: ["afternoon"] },
    },
    {
      key: "maria",
      name: "Dona Maria (luzes)",
      phone: "5511999990002",
      tags: ["vip"],
      totalVisits: 8,
      totalSpent: 1440,
      avgIntervalDays: 30,
      noShowCount: 0,
      loyaltyPoints: 4, // perto do prêmio (falta 1 pra elegível — Bloco 3 Parte 3)
      preferencias: { professionalPreference: ana.id, bestDays: ["sat"], bestTimes: ["morning"] },
    },
    {
      key: "roberto",
      name: "Roberto Lima",
      phone: "5511999990003",
      tags: ["problema"],
      totalVisits: 4,
      totalSpent: 120,
      avgIntervalDays: 30,
      noShowCount: 2,
      cancelLateCount: 1,
      noShowRate: 0.5,
      loyaltyPoints: 4,
    },
    {
      key: "ana_souza",
      name: "Ana Souza",
      phone: "5511999990004",
      tags: ["novo"],
      totalVisits: 1,
      totalSpent: 45,
      loyaltyPoints: 1,
    },
    {
      key: "carla",
      name: "Carla Mendes",
      phone: "5511999990005",
      tags: [],
      totalVisits: 3,
      totalSpent: 135,
      avgIntervalDays: 25,
      noShowCount: 1,
      noShowRate: 1 / 3,
      loyaltyPoints: 2, // Bloco 3 Parte 3 — longe do prêmio (falta 3)
    },
    {
      key: "pedro",
      name: "Pedro Ferreira",
      phone: "5511999990006",
      tags: ["sumido"],
      totalVisits: 8,
      totalSpent: 360,
      lastVisitAt: subDays(new Date(), 70),
      noShowCount: 0,
      loyaltyPoints: 3,
    },
    {
      key: "joao",
      name: "João Vitor",
      phone: "5511999990007",
      tags: [],
      alergias: ["amônia"],
      totalVisits: 5,
      totalSpent: 135,
      noShowCount: 2,
      noShowRate: 0.4,
      loyaltyPoints: 5, // Bloco 3 Parte 3 — elegível pra recompensa (barba grátis)
    },
  ];

  const clients: Record<string, any> = {};
  for (const c of clientsData) {
    const client = await prisma.client.create({
      data: {
        businessId: business.id,
        name: c.name,
        phone: c.phone,
        tags: c.tags ?? [],
        alergias: (c as any).alergias ?? [],
        totalVisits: c.totalVisits ?? 0,
        totalSpent: c.totalSpent ?? 0,
        avgIntervalDays: (c as any).avgIntervalDays ?? null,
        noShowCount: c.noShowCount ?? 0,
        cancelLateCount: (c as any).cancelLateCount ?? 0,
        noShowRate: (c as any).noShowRate ?? 0,
        loyaltyPoints: c.loyaltyPoints ?? 0,
        predictedNoShowRisk: 0,
        lastVisitAt: (c as any).lastVisitAt ?? subDays(new Date(), 15),
        preferencias: (c as any).preferencias ?? {},
      },
    });
    clients[c.key] = client;
  }

  console.log("Criando agendamentos (semana atual)...");
  const today = new Date();

  const appointmentsPlan = [
    { dayOffset: 0, hour: 10, client: "lucas", service: corte, prof: julio, status: Status.CONFIRMED },
    { dayOffset: 0, hour: 14, client: "maria", service: hidratacao, prof: ana, status: Status.CONFIRMED },
    { dayOffset: 1, hour: 9, client: "roberto", service: corte, prof: julio, status: Status.PENDING_CONFIRMATION },
    { dayOffset: 1, hour: 16, client: "ana_souza", service: corte, prof: ana, status: Status.CONFIRMED },
    { dayOffset: 2, hour: 11, client: "carla", service: sobrancelha, prof: ana, status: Status.CONFIRMED },
    { dayOffset: 2, hour: 15, client: "lucas", service: corteBarba, prof: julio, status: Status.CONFIRMED },
    { dayOffset: -1, hour: 10, client: "roberto", service: corte, prof: julio, status: Status.NO_SHOW },
    { dayOffset: -2, hour: 14, client: "maria", service: hidratacao, prof: ana, status: Status.COMPLETED },
    { dayOffset: -3, hour: 9, client: "pedro", service: corte, prof: julio, status: Status.COMPLETED },
    { dayOffset: 3, hour: 13, client: "joao", service: corte, prof: julio, status: Status.CONFIRMED },
  ];

  for (const a of appointmentsPlan) {
    const client = clients[a.client];
    const date = setMinutes(setHours(addDays(today, a.dayOffset), a.hour), 0);
    const endTime = addMinutes(date, a.service.duration);
    const clientConfirmed = a.status === Status.CONFIRMED;
    const isFuture = a.status === Status.CONFIRMED || a.status === Status.PENDING_CONFIRMATION;
    await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: client.id,
        serviceId: a.service.id,
        professionalId: a.prof.id,
        date,
        endTime,
        status: a.status,
        source: Source.WHATSAPP,
        clientConfirmed,
        noShowPredicted: isFuture ? calcRisk(client, clientConfirmed) : 0,
      },
    });
  }

  console.log("Criando histórico de agendamentos (Prontuário Inteligente)...");

  // Maria: 8 visitas concluídas de Luzes, sempre com Ana, a cada ~30 dias
  // (3 delas também com Corte no mesmo dia, pra demonstrar a sugestão de upsell por par)
  for (let i = 8; i >= 1; i--) {
    const visitDate = setMinutes(setHours(subDays(today, i * 30), 10), 0);
    await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: clients.maria.id,
        serviceId: luzes.id,
        professionalId: ana.id,
        date: visitDate,
        endTime: addMinutes(visitDate, luzes.duration),
        status: Status.COMPLETED,
        source: Source.WHATSAPP,
        clientConfirmed: true,
      },
    });
    if (i <= 3) {
      const corteDate = addMinutes(visitDate, luzes.duration + 10);
      await prisma.appointment.create({
        data: {
          businessId: business.id,
          clientId: clients.maria.id,
          serviceId: corte.id,
          professionalId: ana.id,
          date: corteDate,
          endTime: addMinutes(corteDate, corte.duration),
          status: Status.COMPLETED,
          source: Source.WHATSAPP,
          clientConfirmed: true,
        },
      });
    }
  }

  // João: histórico consistente com noShowCount=2 / totalVisits=5 —
  // 3 concluídos (Corte, alternando Júlio e Marcos) + 2 faltas
  const joaoProfs = [julio, marcos, julio];
  for (let i = 0; i < 3; i++) {
    const visitDate = setMinutes(setHours(subDays(today, (3 - i) * 20), 11), 0);
    await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: clients.joao.id,
        serviceId: corte.id,
        professionalId: joaoProfs[i].id,
        date: visitDate,
        endTime: addMinutes(visitDate, corte.duration),
        status: Status.COMPLETED,
        source: Source.WHATSAPP,
        clientConfirmed: true,
      },
    });
  }
  for (let i = 0; i < 2; i++) {
    const noShowDate = setMinutes(setHours(subDays(today, (2 - i) * 15 + 5), 11), 0);
    await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: clients.joao.id,
        serviceId: corte.id,
        professionalId: julio.id,
        date: noShowDate,
        endTime: addMinutes(noShowDate, corte.duration),
        status: Status.NO_SHOW,
        source: Source.WHATSAPP,
        clientConfirmed: false,
      },
    });
  }

  // Pedro: 8 visitas concluídas, 0 faltas (cliente exemplar, sumido há 70 dias)
  for (let i = 8; i >= 1; i--) {
    const visitDate = setMinutes(setHours(subDays(today, 70 + i * 25), 15), 0);
    await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: clients.pedro.id,
        serviceId: corte.id,
        professionalId: julio.id,
        date: visitDate,
        endTime: addMinutes(visitDate, corte.duration),
        status: Status.COMPLETED,
        source: Source.WHATSAPP,
        clientConfirmed: true,
      },
    });
  }

  // Carla: 3 visitas totais — 2 concluídas + 1 falta
  for (let i = 0; i < 2; i++) {
    const visitDate = setMinutes(setHours(subDays(today, (2 - i) * 25 + 10), 11), 0);
    await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: clients.carla.id,
        serviceId: sobrancelha.id,
        professionalId: ana.id,
        date: visitDate,
        endTime: addMinutes(visitDate, sobrancelha.duration),
        status: Status.COMPLETED,
        source: Source.WHATSAPP,
        clientConfirmed: true,
      },
    });
  }
  {
    const noShowDate = setMinutes(setHours(subDays(today, 8), 11), 0);
    await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: clients.carla.id,
        serviceId: sobrancelha.id,
        professionalId: ana.id,
        date: noShowDate,
        endTime: addMinutes(noShowDate, sobrancelha.duration),
        status: Status.NO_SHOW,
        source: Source.WHATSAPP,
        clientConfirmed: false,
      },
    });
  }

  console.log("Criando conversas de exemplo (Painel de Sentimentos)...");
  const now = new Date();
  const conversationsData = [
    {
      client: clients.lucas,
      sentiment: "positive",
      status: "RESOLVED",
      summary: "Cliente agendou corte para terça-feira às 10h.",
      minutesAgo: 12,
      messages: [
        { role: "client", content: "oi, quero marcar um corte", sentiment: "positive" },
        { role: "bot", content: "Fala, Lucas! 💈 Terça às 10h com o Júlio ficou bom pra você?", sentiment: "neutral" },
        { role: "client", content: "perfeito, pode marcar! vlw", sentiment: "positive" },
      ],
    },
    {
      client: clients.maria,
      sentiment: "positive",
      status: "RESOLVED",
      summary: "Cliente elogiou o atendimento da Ana.",
      minutesAgo: 40,
      messages: [
        { role: "client", content: "amei o resultado das luzes hj, a Ana é incrível", sentiment: "positive" },
        { role: "bot", content: "Que alegria, Maria! Vou repassar o elogio pra Ana 😊", sentiment: "neutral" },
      ],
    },
    {
      client: clients.pedro,
      sentiment: "positive",
      status: "RESOLVED",
      summary: "Cliente perguntou sobre horários disponíveis.",
      minutesAgo: 90,
      messages: [
        { role: "client", content: "vcs abrem sábado?", sentiment: "positive" },
        { role: "bot", content: "Abrimos sim! Sábado das 09h às 17h 🙂", sentiment: "neutral" },
      ],
    },
    {
      client: clients.ana_souza,
      sentiment: "positive",
      status: "RESOLVED",
      summary: "Cliente nova, primeiro agendamento confirmado.",
      minutesAgo: 150,
      messages: [
        { role: "client", content: "adorei o corte, ja quero marcar o proximo", sentiment: "positive" },
        { role: "bot", content: "Show, Ana! Bora agendar o próximo então? 💇", sentiment: "neutral" },
      ],
    },
    {
      client: clients.carla,
      sentiment: "positive",
      status: "RESOLVED",
      summary: "Cliente satisfeita com a sobrancelha.",
      minutesAgo: 200,
      messages: [
        { role: "client", content: "ficou linda a sobrancelha, obrigada!", sentiment: "positive" },
        { role: "bot", content: "Fico feliz que gostou, Carla! Até a próxima 😊", sentiment: "neutral" },
      ],
    },
    {
      client: clients.joao,
      sentiment: "neutral",
      status: "RESOLVED",
      summary: "Cliente perguntou o preço do corte.",
      minutesAgo: 300,
      messages: [
        { role: "client", content: "quanto ta o corte mesmo?", sentiment: "neutral" },
        { role: "bot", content: "O corte de cabelo tá R$ 45 😊", sentiment: "neutral" },
      ],
    },
    {
      client: clients.lucas,
      sentiment: "neutral",
      status: "RESOLVED",
      summary: "Cliente perguntou o horário de funcionamento.",
      minutesAgo: 400,
      messages: [
        { role: "client", content: "que horas vcs fecham hoje", sentiment: "neutral" },
        { role: "bot", content: "Hoje fechamos às 19h!", sentiment: "neutral" },
      ],
    },
    {
      client: clients.pedro,
      sentiment: "neutral",
      status: "BOT_HANDLING",
      summary: "Cliente pediu pra remarcar o horário.",
      minutesAgo: 20,
      messages: [
        { role: "client", content: "posso remarcar meu horario de sabado?", sentiment: "neutral" },
        { role: "bot", content: "Claro! Pra quando você quer remarcar?", sentiment: "neutral" },
      ],
    },
    {
      client: clients.roberto,
      sentiment: "negative",
      status: "NEEDS_HUMAN",
      needsAttention: true,
      summary: "Cliente reclamou que a tintura não pegou direito.",
      minutesAgo: 5,
      messages: [
        { role: "client", content: "a tintura que o julio passou não pegou direito, fiquei chateado", sentiment: "negative" },
        { role: "bot", content: "Poxa, sinto muito 😕 Vou chamar o dono pra te ajudar agora mesmo.", sentiment: "neutral" },
      ],
    },
    {
      client: clients.carla,
      sentiment: "negative",
      status: "NEEDS_HUMAN",
      needsAttention: true,
      summary: "Cliente reclamou que atrasou 30 minutos.",
      minutesAgo: 8,
      messages: [
        { role: "client", content: "esperei 30 minutos pra ser atendida, isso é um absurdo", sentiment: "negative" },
        { role: "bot", content: "Sinto muito pela demora, Carla 😞 Vou chamar o dono pra resolver com você.", sentiment: "neutral" },
      ],
    },
  ];

  for (const conv of conversationsData) {
    const baseTime = now.getTime() - conv.minutesAgo * 60 * 1000;
    const messages = conv.messages.map((m, i) => ({
      ...m,
      timestamp: new Date(baseTime + i * 60 * 1000).toISOString(),
    }));
    await prisma.conversation.create({
      data: {
        businessId: business.id,
        clientId: conv.client.id,
        clientPhone: conv.client.phone,
        clientName: conv.client.name,
        status: conv.status as any,
        sentiment: conv.sentiment,
        needsAttention: (conv as any).needsAttention ?? false,
        summary: conv.summary,
        messages,
        updatedAt: new Date(baseTime + (messages.length - 1) * 60 * 1000),
      },
    });
  }

  console.log("Criando lista de espera (Bloco 3 Parte 1)...");
  await prisma.waitingListEntry.createMany({
    data: [
      {
        businessId: business.id,
        clientId: clients.maria.id, // VIP — deve aparecer primeiro na fila
        serviceId: luzes.id,
        preferredDate: addDays(today, 3),
        flexibleDates: false,
        preferredPeriod: "morning",
        createdAt: subDays(today, 2),
      },
      {
        businessId: business.id,
        clientId: clients.carla.id,
        serviceId: corte.id,
        preferredDate: addDays(today, 1),
        preferredPeriod: "afternoon",
        createdAt: subDays(today, 5),
      },
      {
        businessId: business.id,
        clientId: clients.ana_souza.id,
        serviceId: sobrancelha.id,
        preferredDate: addDays(today, 2),
        preferredPeriod: "evening",
        createdAt: subDays(today, 1),
      },
    ],
  });

  console.log("Criando feirão de exemplo (Bloco 3 Parte 2)...");
  await prisma.flashSale.create({
    data: {
      businessId: business.id,
      name: "Terça Maluca",
      discountPercent: 20,
      serviceIds: [corte.id, barba.id],
      professionalIds: [julio.id, marcos.id],
      startDate: subDays(today, 1),
      endDate: addDays(today, 1),
      daysOfWeek: [2],
      timeStart: "10:00",
      timeEnd: "14:00",
      targetClients: ["sumido"],
      message: "🔥 Terça Maluca! Corte e barba com 20% OFF hoje das 10h às 14h.",
      sentCount: 12,
      bookedCount: 3,
      active: true,
    },
  });

  console.log("Seed concluído! Login: ze@barbeariadoze.com.br / senha123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
