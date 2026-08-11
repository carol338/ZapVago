/**
 * Rate limit simples em memória para rotas de API (60 req/min por IP).
 * Para produção multi-instância, trocar por um contador no Redis.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

const LIMIT = 60;
const WINDOW_MS = 60_000;

export function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: LIMIT - 1 };
  }

  if (bucket.count >= LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: LIMIT - bucket.count };
}
