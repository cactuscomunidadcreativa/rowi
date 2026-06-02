/**
 * =========================================================
 * 🛡️ Distributed rate limiting (Upstash Redis, edge-safe)
 * =========================================================
 *
 * El store in-memory del middleware (un Map por instancia serverless) sólo
 * defiende ~N× el límite configurado y se reinicia en cada cold start. Para
 * los endpoints de IA (sensibles a COSTO) eso no alcanza. Este módulo respalda
 * el rate limit en Redis compartido (Upstash) cuando está configurado.
 *
 * Contrato de seguridad:
 * - Se ACTIVA sólo si `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
 *   están presentes. Sin ellas, `distributedRateLimitEnabled === false` y el
 *   middleware mantiene su comportamiento in-memory actual (cero cambios).
 * - `distributedRateLimit()` es FAIL-OPEN: ante cualquier error de red/Redis
 *   devuelve `null`, y el caller cae al store in-memory. Nunca tira el request.
 *
 * `@upstash/ratelimit` y `@upstash/redis` ya son dependencias del repo y
 * funcionan en el Edge Runtime (es el caso de uso canónico de Vercel).
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const distributedRateLimitEnabled = !!(REDIS_URL && REDIS_TOKEN);

const redis = distributedRateLimitEnabled
  ? new Redis({ url: REDIS_URL!, token: REDIS_TOKEN! })
  : null;

// Un Ratelimit por (prefijo, límite, ventana). Se crean una sola vez y se
// reutilizan entre requests dentro de la misma instancia.
const limiters = new Map<string, Ratelimit>();

function getLimiter(prefix: string, limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;
  const cacheKey = `${prefix}:${limit}:${windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    const seconds = Math.max(1, Math.ceil(windowMs / 1000));
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${seconds} s`),
      prefix: `rowi:rl:${prefix}`,
      analytics: false,
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Devuelve el resultado del rate limit distribuido, o `null` si Redis no está
 * configurado o falló (el caller debe entonces usar el fallback in-memory).
 */
export async function distributedRateLimit(opts: {
  prefix: string;
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult | null> {
  const limiter = getLimiter(opts.prefix, opts.limit, opts.windowMs);
  if (!limiter) return null;
  try {
    const r = await limiter.limit(opts.key);
    return { allowed: r.success, remaining: r.remaining, resetAt: r.reset };
  } catch {
    // Fail-open: no romper el tráfico si Redis está caído/inaccesible.
    return null;
  }
}
