/**
 * Rate limit distribuído (Upstash Redis) quando configurado; cai pra um
 * Map em memória do processo quando não está — útil pra desenvolvimento
 * local, mas NÃO protege de verdade em produção na Vercel: cada
 * requisição pode cair numa instância serverless diferente, e o Map não é
 * compartilhado entre elas.
 *
 * Usa @upstash/redis (REST, funciona em serverless/edge sem conexão TCP
 * persistente) + @upstash/ratelimit — não confundir com REDIS_URL, que é
 * a conexão TCP usada pelo BullMQ em src/lib/queue.ts (protocolo
 * diferente, não dá pra reusar aqui). O gatilho pra usar Redis de verdade
 * é UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN estarem configurados.
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = UPSTASH_URL && UPSTASH_TOKEN ? new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN }) : null;

// Uma instância de Ratelimit por combinação (limite, janela) — reusar evita
// recriar o objeto a cada chamada; o estado de fato mora no Redis, não aqui.
const upstashLimiters = new Map<string, Ratelimit>();
function getUpstashLimiter(limit: number, windowSeconds: number): Ratelimit {
  const cacheKey = `${limit}:${windowSeconds}`;
  let limiter = upstashLimiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: "zapvago-ratelimit",
    });
    upstashLimiters.set(cacheKey, limiter);
  }
  return limiter;
}

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();
function checkMemoryRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1 };
  }
  if (bucket.count >= limit) return { allowed: false, remaining: 0 };

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/** Verifica e consome uma tentativa da chave dada, dentro do limite/janela informados. */
export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  if (redis) {
    const limiter = getUpstashLimiter(limit, windowSeconds);
    const result = await limiter.limit(key);
    return { allowed: result.success, remaining: result.remaining };
  }
  return checkMemoryRateLimit(key, limit, windowSeconds);
}

/** Extrai o IP do cliente de um Headers (rotas de API) ou de um objeto plano (NextAuth authorize()). */
export function getClientIp(headers: Headers | Record<string, any> | undefined): string {
  if (!headers) return "unknown";
  const get = (key: string): string | null => {
    if (headers instanceof Headers) return headers.get(key);
    const value = (headers as Record<string, any>)[key];
    return Array.isArray(value) ? value[0] : value ?? null;
  };
  const forwarded = get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return get("x-real-ip") ?? "unknown";
}
