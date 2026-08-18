/**
 * Autenticação compartilhada das rotas /api/cron/* — todas exigem o header
 * Authorization: Bearer CRON_SECRET, comparado em tempo constante
 * (crypto.timingSafeEqual) pra não vazar o segredo por timing attack.
 * Usado tanto pelo Vercel Cron (que injeta esse header automaticamente
 * quando CRON_SECRET está configurado no projeto) quanto por um cron
 * externo (cron-job.org, GitHub Actions agendado etc.).
 */
import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

function isAuthorizedCronRequest(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!auth || !secret) return false;

  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  const received = Buffer.from(auth, "utf8");

  // Buffers de tamanhos diferentes não podem ir para timingSafeEqual.
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

/** Retorna uma resposta 401 se a requisição não trouxer o CRON_SECRET correto; null se estiver autorizada. */
export function requireCronSecret(req: NextRequest): NextResponse | null {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  return null;
}
