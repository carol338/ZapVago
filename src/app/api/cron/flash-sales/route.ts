/**
 * GET/POST /api/cron/flash-sales — dispara feirões automaticamente quando a
 * campanha entra na janela configurada (data + dia da semana + horário),
 * sem depender do dono clicar em "Ativar". `flashSaleQueue` (BullMQ) existia
 * no código com um worker pronto, mas nunca era de fato enfileirada em
 * lugar nenhum — essa rota substitui essa peça que faltava, no mesmo
 * padrão serverless das outras (/api/cron/reminders, /api/cron/monthly-report).
 * POST /api/flash-sales/[id]/activate continua existindo pra disparo manual.
 *
 * Idempotência: só processa feirões com sentCount = 0 E active = true.
 * Depois de processado (mesmo que a audiência tenha ficado vazia), marca
 * active = false — a campanha vira "Encerrado" no painel e nunca mais entra
 * nesse filtro, então o cron pode rodar a cada 15min sem risco de reenviar.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/cron-auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { resolveFlashSaleAudience } from "@/lib/flash-sale-audience";
import { hasFeature } from "@/lib/plan-limits";
import { toZonedTime } from "date-fns-tz";

// timeStart/timeEnd/daysOfWeek são configurados no horário LOCAL do negócio
// (ex: "10:00"), mas o servidor da Vercel roda em UTC — convertemos "agora"
// pra America/Sao_Paulo antes de comparar. Mesma classe de bug de timezone
// já corrigida uma vez neste projeto (criação de agendamentos).
const TIMEZONE = "America/Sao_Paulo";

async function dispatchDueFlashSales(req: NextRequest): Promise<NextResponse> {
  const unauthorized = requireCronSecret(req);
  if (unauthorized) return unauthorized;

  const now = new Date();
  const zonedNow = toZonedTime(now, TIMEZONE);
  const currentTime = `${String(zonedNow.getHours()).padStart(2, "0")}:${String(zonedNow.getMinutes()).padStart(2, "0")}`;
  const jsDay = zonedNow.getDay(); // 0=dom..6=sáb
  const isoDay = jsDay === 0 ? 7 : jsDay; // 1=seg..7=dom, igual à convenção do schema (daysOfWeek)

  const dueFlashSales = await prisma.flashSale.findMany({
    where: {
      active: true,
      startDate: { lte: now },
      endDate: { gte: now },
      sentCount: 0,
      timeStart: { lte: currentTime },
      timeEnd: { gte: currentTime },
      OR: [{ daysOfWeek: { isEmpty: true } }, { daysOfWeek: { has: isoDay } }],
    },
  });

  console.log(
    `[cron/flash-sales] ${dueFlashSales.length} feirão(ões) elegível(is) às ${currentTime} (${TIMEZONE}, dia ISO ${isoDay}): ${dueFlashSales.map((f) => f.id).join(", ") || "nenhum"}`
  );

  let processed = 0;
  for (const flashSale of dueFlashSales) {
    const business = await prisma.business.findUnique({ where: { id: flashSale.businessId } });
    if (!business) {
      console.error(`[cron/flash-sales] Feirão ${flashSale.id} sem negócio associado (businessId ${flashSale.businessId}) — pulado.`);
      continue;
    }

    // Defesa extra: o negócio pode ter feito downgrade depois de agendar a
    // campanha. Marca active=false sem enviar nada, pelo mesmo motivo do
    // comentário acima (nunca mais reprocessar).
    if (!(await hasFeature(flashSale.businessId, "flashSales"))) {
      await prisma.flashSale.update({ where: { id: flashSale.id }, data: { active: false } });
      console.log(`[cron/flash-sales] Feirão ${flashSale.id} pulado — negócio ${flashSale.businessId} não tem mais o plano com Feirão.`);
      continue;
    }

    const link = `${process.env.NEXT_PUBLIC_APP_URL}/${business.slug}/agendar?flashSale=${flashSale.id}`;
    const clients = await resolveFlashSaleAudience(flashSale.businessId, flashSale.targetClients, flashSale.startDate, flashSale.endDate);

    let sent = 0;
    for (const c of clients) {
      const msg =
        (flashSale.message || `🔥 ${flashSale.name}! ${flashSale.discountPercent}% OFF hoje. Bora garantir seu horário?`) +
        `\n\n👉 ${link}`;
      const result = await sendWhatsAppMessage(c.phone, msg, flashSale.businessId);
      if (result.success) sent += 1;
    }

    // active=false garante que esse feirão nunca mais entra no filtro acima,
    // mesmo se a audiência calculada agora tiver ficado vazia (sentCount
    // continuaria 0 nesse caso, e sozinho não bastaria pra travar o reenvio).
    await prisma.flashSale.update({
      where: { id: flashSale.id },
      data: { sentCount: { increment: sent }, active: false },
    });

    console.log(
      `[cron/flash-sales] Processado: feirão "${flashSale.name}" (${flashSale.id}, negócio ${flashSale.businessId}) — ${clients.length} na audiência, ${sent} mensagens enviadas.`
    );
    processed += 1;
  }

  return NextResponse.json({ success: true, processed });
}

export async function GET(req: NextRequest) {
  return dispatchDueFlashSales(req);
}

export async function POST(req: NextRequest) {
  return dispatchDueFlashSales(req);
}
