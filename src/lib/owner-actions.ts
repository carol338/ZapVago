/**
 * Bloco 3 Parte 4.4 — ações interativas do relatório mensal. Se o dono
 * responder "sim" (mandar mensagem pros sumidos) ou "feirão" (sugestão de
 * feirão) pelo WhatsApp dentro de alguns dias de ter recebido o relatório,
 * a gente dispara a ação sem ele precisar abrir o painel.
 */
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage, normalizePhone } from "@/lib/whatsapp";
import { differenceInDays, differenceInHours } from "date-fns";

const REPLY_WINDOW_HOURS = 72; // janela pra considerar a resposta como referente ao último relatório enviado
const SUMIDO_DAYS = 60;

export function isOwnerPhone(ownerPhone: string, incomingPhone: string) {
  return normalizePhone(ownerPhone) === normalizePhone(incomingPhone);
}

/** Processa uma mensagem recebida do NÚMERO DO DONO (não é o bot de atendimento a clientes). */
export async function handleOwnerReply(businessId: string, text: string): Promise<boolean> {
  const owner = await prisma.owner.findUnique({ where: { businessId } });
  if (!owner) return false;

  const withinWindow =
    owner.lastMonthlyReportAt && differenceInHours(new Date(), owner.lastMonthlyReportAt) <= REPLY_WINDOW_HOURS;
  if (!withinWindow) return false; // não é uma resposta a um relatório recente — deixa passar sem ação especial

  const lower = text.toLowerCase().trim();

  if (/^sim\b/.test(lower)) {
    const sumidos = await prisma.client.findMany({
      where: { businessId, lastVisitAt: { not: null } },
    });
    const alvo = sumidos.filter((c) => c.lastVisitAt && differenceInDays(new Date(), c.lastVisitAt) >= SUMIDO_DAYS);

    let enviados = 0;
    for (const c of alvo) {
      const result = await sendWhatsAppMessage(
        c.phone,
        `Saudades de você, ${c.name.split(" ")[0]}! 💈 Que tal voltar? Temos horários disponíveis essa semana. Quer agendar?`,
        businessId
      );
      if (result.success) enviados += 1;
    }

    await sendWhatsAppMessage(owner.phone, `✅ Mensagem enviada para ${enviados} cliente(s) sumido(s).`, businessId);
    return true;
  }

  if (/feir[aã]o/.test(lower)) {
    await sendWhatsAppMessage(
      owner.phone,
      `⚡ Boa! Abre o painel em Feirões e crie uma oferta pro horário mais ocioso — o sistema já dispara pros clientes certos automaticamente.`,
      businessId
    );
    return true;
  }

  return false;
}
