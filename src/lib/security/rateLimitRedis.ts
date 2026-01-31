/**
 * =========================================================
 * 🛡️ Rate Limiter con Upstash Redis
 * =========================================================
 *
 * Rate limiting distribuido usando Upstash Redis.
 * Compatible con Edge Runtime y múltiples instancias.
 *
 * CONFIGURACIÓN:
 * Agregar a .env:
 *   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN=AXxx...
 *
 * Si no están configuradas, usa fallback en memoria.
 *
 * USO:
 * ```ts
 * import { rateLimitRedis, getIdentifier } from "@/lib/security/rateLimitRedis";
 *
 * const identifier = getIdentifier(req);
 * const { success, remaining, reset } = await rateLimitRedis.limit(identifier);
 *
 * if (!success) {
 *   return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 * }
 * ```
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// =========================================================
// Configuration
// =========================================================

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Verificar si Upstash está configurado
const isUpstashConfigured = !!(UPSTASH_URL && UPSTASH_TOKEN);

// Log de configuración (solo una vez al inicio)
if (typeof window === "undefined") {
  if (isUpstashConfigured) {
    console.log("✅ Rate limiting: Using Upstash Redis (distributed)");
  } else {
    console.warn(
      "⚠️ Rate limiting: Using in-memory fallback. " +
        "Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production."
    );
  }
}

// =========================================================
// Redis Client (lazy initialization)
// =========================================================

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!isUpstashConfigured) return null;

  if (!redisClient) {
    redisClient = new Redis({
      url: UPSTASH_URL!,
      token: UPSTASH_TOKEN!,
    });
  }

  return redisClient;
}

// =========================================================
// Rate Limiters (Upstash)
// =========================================================

type RateLimitConfig = {
  requests: number;
  window: `${number} s` | `${number} m` | `${number} h` | `${number} d`;
};

// Configuraciones por tipo de endpoint
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  auth: { requests: 10, window: "1 m" },
  authStrict: { requests: 5, window: "5 m" },
  checkout: { requests: 5, window: "1 m" },
  ai: { requests: 30, window: "1 m" },
  admin: { requests: 50, window: "1 m" },
  api: { requests: 100, window: "1 m" },
  webhook: { requests: 1000, window: "1 m" },
  upload: { requests: 10, window: "1 m" },
  email: { requests: 20, window: "1 h" },
};

// Cache de rate limiters
const rateLimiters = new Map<string, Ratelimit>();

/**
 * Obtiene o crea un rate limiter para un tipo específico
 */
function getRateLimiter(type: keyof typeof RATE_LIMIT_CONFIGS): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;

  const cached = rateLimiters.get(type);
  if (cached) return cached;

  const config = RATE_LIMIT_CONFIGS[type];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: true,
    prefix: `rowi:ratelimit:${type}`,
  });

  rateLimiters.set(type, limiter);
  return limiter;
}

// =========================================================
// Fallback In-Memory Rate Limiter
// =========================================================

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();
const MAX_MEMORY_ENTRIES = 10000;

function cleanupMemory(): void {
  const now = Date.now();
  const entries = Array.from(memoryStore.entries());

  for (const [key, entry] of entries) {
    if (entry.resetAt < now) {
      memoryStore.delete(key);
    }
  }

  if (memoryStore.size > MAX_MEMORY_ENTRIES) {
    const sorted = entries.sort((a, b) => a[1].resetAt - b[1].resetAt);
    const toRemove = sorted.slice(0, memoryStore.size - MAX_MEMORY_ENTRIES + 100);
    for (const [key] of toRemove) {
      memoryStore.delete(key);
    }
  }
}

async function memoryRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const now = Date.now();

  // Parsear window
  const windowMatch = config.window.match(/^(\d+)\s*(s|m|h|d)$/);
  if (!windowMatch) {
    return { success: true, remaining: config.requests, reset: now + 60000 };
  }

  const amount = parseInt(windowMatch[1], 10);
  const unit = windowMatch[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const windowMs = amount * (multipliers[unit] || 60000);

  const key = `memory:${identifier}`;
  let entry = memoryStore.get(key);

  // Limpiar periódicamente
  if (memoryStore.size % 100 === 0) {
    cleanupMemory();
  }

  // Nueva entrada o expirada
  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs };
    memoryStore.set(key, entry);
    return {
      success: true,
      remaining: config.requests - 1,
      reset: entry.resetAt,
    };
  }

  // Incrementar
  entry.count++;

  if (entry.count > config.requests) {
    return {
      success: false,
      remaining: 0,
      reset: entry.resetAt,
    };
  }

  return {
    success: true,
    remaining: config.requests - entry.count,
    reset: entry.resetAt,
  };
}

// =========================================================
// Public API
// =========================================================

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
  isRedis: boolean;
}

/**
 * Aplica rate limiting usando Upstash Redis (o memoria como fallback)
 *
 * @param identifier - Identificador único (IP, userId, etc.)
 * @param type - Tipo de rate limit a aplicar
 * @returns Resultado del rate limiting
 */
export async function rateLimit(
  identifier: string,
  type: keyof typeof RATE_LIMIT_CONFIGS = "api"
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[type];

  // Intentar usar Upstash Redis
  const limiter = getRateLimiter(type);

  if (limiter) {
    try {
      const result = await limiter.limit(identifier);
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
        limit: config.requests,
        isRedis: true,
      };
    } catch (error) {
      console.error("❌ Upstash rate limit error, falling back to memory:", error);
      // Fallback a memoria si Redis falla
    }
  }

  // Fallback a memoria
  const memResult = await memoryRateLimit(`${type}:${identifier}`, config);
  return {
    ...memResult,
    limit: config.requests,
    isRedis: false,
  };
}

/**
 * Obtiene el identificador del cliente desde la request
 */
export function getIdentifier(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  if (cfIp) return cfIp.trim();
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIp) return realIp.trim();

  return "unknown";
}

/**
 * Genera identificador compuesto de IP + path
 */
export function getRouteIdentifier(req: Request): string {
  const ip = getIdentifier(req);
  const path = new URL(req.url).pathname;
  return `${ip}:${path}`;
}

/**
 * Genera identificador para usuario autenticado
 */
export function getUserIdentifier(req: Request, userId: string): string {
  const ip = getIdentifier(req);
  return `${ip}:user:${userId}`;
}

// =========================================================
// Preconfigured Rate Limiters (convenience functions)
// =========================================================

export const rateLimiters_redis = {
  auth: (id: string) => rateLimit(id, "auth"),
  authStrict: (id: string) => rateLimit(id, "authStrict"),
  checkout: (id: string) => rateLimit(id, "checkout"),
  ai: (id: string) => rateLimit(id, "ai"),
  admin: (id: string) => rateLimit(id, "admin"),
  api: (id: string) => rateLimit(id, "api"),
  webhook: (id: string) => rateLimit(id, "webhook"),
  upload: (id: string) => rateLimit(id, "upload"),
  email: (id: string) => rateLimit(id, "email"),
};

// =========================================================
// Health Check
// =========================================================

/**
 * Verifica si Upstash Redis está funcionando
 */
export async function checkRedisHealth(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  const redis = getRedisClient();

  if (!redis) {
    return { connected: false, error: "Upstash not configured" };
  }

  const start = Date.now();
  try {
    await redis.ping();
    return { connected: true, latency: Date.now() - start };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Obtiene estadísticas del rate limiter
 */
export function getRateLimitInfo(): {
  isUpstashConfigured: boolean;
  memoryStoreSize: number;
  configuredLimiters: string[];
} {
  return {
    isUpstashConfigured,
    memoryStoreSize: memoryStore.size,
    configuredLimiters: Object.keys(RATE_LIMIT_CONFIGS),
  };
}
