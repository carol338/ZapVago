/**
 * Seed do ZapVago — cria um negócio de barbearia fake para testes,
 * com serviços, profissionais, clientes e agendamentos.
 *
 * Rodar com: npm run db:seed
 */
import { PrismaClient, Category, Status, Source } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, addMinutes, subDays, setHours, setMinutes } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("Limpando dados antigos...");
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
      serviceIds: [corte.id, sobrancelha.id, hidratacao.id],
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
      name: "Dona Maria (luzes)",
      phone: "5511999990002",
      tags: ["vip"],
      totalVisits: 15,
      totalSpent: 1200,
      avgIntervalDays: 45,
      noShowCount: 0,
      loyaltyPoints: 0,
      preferencias: { professionalPreference: ana.id, bestDays: ["sat"], bestTimes: ["morning"] },
    },
    {
      name: "Roberto Lima",
      phone: "5511999990003",
      tags: ["problema"],
      totalVisits: 4,
      totalSpent: 120,
      avgIntervalDays: 30,
      noShowCount: 2,
      noShowRate: 0.5,
      loyaltyPoints: 4,
      predictedNoShowRisk: 0.62,
    },
    {
      name: "Ana Souza",
      phone: "5511999990004",
      tags: ["novo"],
      totalVisits: 1,
      totalSpent: 45,
      loyaltyPoints: 1,
    },
    {
      name: "Carla Mendes",
      phone: "5511999990005",
      tags: [],
      totalVisits: 6,
      totalSpent: 280,
      avgIntervalDays: 25,
      loyaltyPoints: 1,
    },
    {
      name: "Pedro Ferreira",
      phone: "5511999990006",
      tags: ["sumido"],
      totalVisits: 3,
      totalSpent: 135,
      lastVisitAt: subDays(new Date(), 70),
      loyaltyPoints: 3,
    },
    {
      name: "João Vitor",
      phone: "5511999990007",
      tags: [],
      alergias: ["amônia"],
      totalVisits: 2,
      totalSpent: 90,
      loyaltyPoints: 2,
    },
  ];

  const clients = [];
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
        noShowRate: (c as any).noShowRate ?? 0,
        loyaltyPoints: c.loyaltyPoints ?? 0,
        predictedNoShowRisk: (c as any).predictedNoShowRisk ?? 0,
        lastVisitAt: (c as any).lastVisitAt ?? subDays(new Date(), 15),
        preferencias: (c as any).preferencias ?? {},
      },
    });
    clients.push(client);
  }

  console.log("Criando agendamentos (semana atual)...");
  const today = new Date();
  const services = [corte, barba, corteBarba, sobrancelha, hidratacao];
  const professionals = [julio, ana];

  const appointmentsPlan = [
    { dayOffset: 0, hour: 10, client: 0, service: corte, prof: julio, status: Status.CONFIRMED },
    { dayOffset: 0, hour: 14, client: 1, service: hidratacao, prof: ana, status: Status.CONFIRMED },
    { dayOffset: 1, hour: 9, client: 2, service: corte, prof: julio, status: Status.PENDING_CONFIRMATION },
    { dayOffset: 1, hour: 16, client: 3, service: corte, prof: ana, status: Status.CONFIRMED },
    { dayOffset: 2, hour: 11, client: 4, service: sobrancelha, prof: ana, status: Status.CONFIRMED },
    { dayOffset: 2, hour: 15, client: 0, service: corteBarba, prof: julio, status: Status.CONFIRMED },
    { dayOffset: -1, hour: 10, client: 2, service: corte, prof: julio, status: Status.NO_SHOW },
    { dayOffset: -2, hour: 14, client: 1, service: hidratacao, prof: ana, status: Status.COMPLETED },
    { dayOffset: -3, hour: 9, client: 5, service: corte, prof: julio, status: Status.COMPLETED },
    { dayOffset: 3, hour: 13, client: 6, service: corte, prof: julio, status: Status.CONFIRMED },
  ];

  for (const a of appointmentsPlan) {
    const date = setMinutes(setHours(addDays(today, a.dayOffset), a.hour), 0);
    const endTime = addMinutes(date, a.service.duration);
    await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: clients[a.client].id,
        serviceId: a.service.id,
        professionalId: a.prof.id,
        date,
        endTime,
        status: a.status,
        source: Source.WHATSAPP,
        clientConfirmed: a.status === Status.CONFIRMED,
        noShowPredicted: clients[a.client].predictedNoShowRisk ?? 0,
      },
    });
  }

  console.log("Criando conversas de exemplo (para o painel de sentimentos)...");
  await prisma.conversation.create({
    data: {
      businessId: business.id,
      clientId: clients[2].id,
      clientPhone: clients[2].phone,
      clientName: clients[2].name,
      status: "NEEDS_HUMAN",
      sentiment: "negative",
      needsAttention: true,
      summary: "Cliente reclamou que a tintura não pegou direito.",
      messages: [
        { role: "client", content: "a tintura que o julio passou não pegou direito, fiquei chateado", timestamp: new Date().toISOString(), sentiment: "negative" },
        { role: "bot", content: "Poxa, sinto muito 😕 Vou chamar o dono pra te ajudar agora mesmo.", timestamp: new Date().toISOString(), sentiment: "neutral" },
      ],
    },
  });

  await prisma.conversation.create({
    data: {
      businessId: business.id,
      clientId: clients[0].id,
      clientPhone: clients[0].phone,
      clientName: clients[0].name,
      status: "RESOLVED",
      sentiment: "positive",
      summary: "Cliente agendou corte para terça-feira às 10h.",
      messages: [
        { role: "client", content: "oi, quero marcar um corte", timestamp: new Date().toISOString(), sentiment: "positive" },
        { role: "bot", content: "Fala, Lucas! 💈 Terça às 10h com o Júlio ficou bom pra você?", timestamp: new Date().toISOString(), sentiment: "neutral" },
      ],
    },
  });

  console.log("Criando entrada na lista de espera...");
  await prisma.waitingListEntry.create({
    data: {
      businessId: business.id,
      clientId: clients[4].id,
      serviceId: corte.id,
      preferredDate: addDays(today, 1),
      preferredPeriod: "afternoon",
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
