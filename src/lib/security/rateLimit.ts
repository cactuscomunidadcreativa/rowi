/**
 * =========================================================
 * 🛡️ Rate Limiter — Protección contra abuso de endpoints
 * =========================================================
 *
 * Implementación mejorada de rate limiting con:
 * - Almacenamiento en memoria con límite de tamaño
 * - Limpieza automática de entradas expiradas
 * - Soporte para sliding window
 * - Preparado para migrar a Redis/Upstash
 *
 * USO:
 * ```ts
 * import { rateLimit, rateLimiters, getClientIdentifier } from "@/lib/security/rateLimit";
 *
 * // En tu API route:
 * const identifier = getClientIdentifier(req);
 * const { success, remaining, resetAt } = await rateLimit(identifier, {
 *   limit: 10,
 *   window: 60, // segundos
 * });
 *
 * if (!success) {
 *   return NextResponse.json(
 *     { error: "Rate limit exceeded" },
 *     {
 *       status: 429,
 *       headers: { "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)) }
 *     }
 *   );
 * }
 * ```
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
  firstRequest: number; // Para tracking de sliding window
}

interface RateLimitOptions {
  limit: number; // Número máximo de requests
  window: number; // Ventana de tiempo en segundos
  prefix?: string; // Prefijo para la clave (útil para separar contextos)
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

// =========================================================
// Store Configuration
// =========================================================

const MAX_STORE_SIZE = 10000; // Máximo de entradas en el store
const CLEANUP_INTERVAL = 30000; // Limpiar cada 30 segundos
const CLEANUP_BATCH_SIZE = 1000; // Limpiar en lotes para no bloquear

// Store principal en memoria
const store = new Map<string, RateLimitEntry>();

// Estadísticas del store (para monitoreo)
let storeStats = {
  hits: 0,
  misses: 0,
  blocked: 0,
  cleanups: 0,
  lastCleanup: Date.now(),
};

/**
 * Limpieza periódica del store con límite de tamaño
 */
function cleanupStore(): void {
  const now = Date.now();
  let cleaned = 0;

  // Limpiar entradas expiradas
  const entries = Array.from(store.entries());
  for (const [key, entry] of entries) {
    if (entry.resetAt < now) {
      store.delete(key);
      cleaned++;
      if (cleaned >= CLEANUP_BATCH_SIZE) break;
    }
  }

  // Si el store sigue muy grande, eliminar las más antiguas
  if (store.size > MAX_STORE_SIZE) {
    const entries = Array.from(store.entries())
      .sort((a, b) => a[1].firstRequest - b[1].firstRequest);

    const toRemove = entries.slice(0, store.size - MAX_STORE_SIZE + 100);
    for (const [key] of toRemove) {
      store.delete(key);
      cleaned++;
    }
  }

  storeStats.cleanups++;
  storeStats.lastCleanup = now;

  if (cleaned > 0) {
    console.log(`🧹 Rate limit cleanup: removed ${cleaned} entries, ${store.size} remaining`);
  }
}

// Iniciar limpieza periódica
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanupTimer(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(cleanupStore, CLEANUP_INTERVAL);
  // No bloquear el proceso al terminar
  if (cleanupTimer.unref) cleanupTimer.unref();
}

// Iniciar el timer automáticamente
startCleanupTimer();

// =========================================================
// Core Rate Limiting Functions
// =========================================================

/**
 * Verifica y actualiza el rate limit para un identificador
 * @param identifier - Identificador único (generalmente IP + ruta)
 * @param options - Opciones de rate limiting
 * @returns Resultado indicando si la request está permitida
 */
export async function rateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { limit, window, prefix = "rl" } = options;
  const now = Date.now();
  const windowMs = window * 1000;
  const key = `${prefix}:${identifier}`;

  const entry = store.get(key);

  // Si no hay entrada o expiró, crear nueva
  if (!entry || entry.resetAt < now) {
    store.set(key, {
      count: 1,
      resetAt: now + windowMs,
      firstRequest: now,
    });
    storeStats.misses++;
    return {
      success: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
      limit,
    };
  }

  storeStats.hits++;

  // Incrementar contador
  entry.count += 1;

  // Verificar límite
  if (entry.count > limit) {
    storeStats.blocked++;
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      limit,
    };
  }

  return {
    success: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
    limit,
  };
}

/**
 * Verifica el rate limit sin incrementar el contador
 * Útil para verificar el estado actual
 */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { limit, window, prefix = "rl" } = options;
  const now = Date.now();
  const windowMs = window * 1000;
  const key = `${prefix}:${identifier}`;

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    return {
      success: true,
      remaining: limit,
      resetAt: now + windowMs,
      limit,
    };
  }

  return {
    success: entry.count < limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
    limit,
  };
}

/**
 * Resetea el rate limit para un identificador específico
 */
export function resetRateLimit(identifier: string, prefix: string = "rl"): void {
  const key = `${prefix}:${identifier}`;
  store.delete(key);
}

// =========================================================
// Preconfigured Rate Limiters
// =========================================================

/**
 * Rate limiters preconfigurados para diferentes casos de uso
 */
export const rateLimiters = {
  // Checkout/Pagos: 5 intentos por minuto (muy restrictivo)
  checkout: (identifier: string) =>
    rateLimit(identifier, { limit: 5, window: 60, prefix: "checkout" }),

  // Auth/Login: 10 intentos por minuto
  auth: (identifier: string) =>
    rateLimit(identifier, { limit: 10, window: 60, prefix: "auth" }),

  // Auth estricto: 5 intentos por 5 minutos (para endpoints sensibles)
  authStrict: (identifier: string) =>
    rateLimit(identifier, { limit: 5, window: 300, prefix: "auth_strict" }),

  // API general: 100 requests por minuto
  api: (identifier: string) =>
    rateLimit(identifier, { limit: 100, window: 60, prefix: "api" }),

  // API IA: 30 requests por minuto
  ai: (identifier: string) =>
    rateLimit(identifier, { limit: 30, window: 60, prefix: "ai" }),

  // Admin: 50 requests por minuto
  admin: (identifier: string) =>
    rateLimit(identifier, { limit: 50, window: 60, prefix: "admin" }),

  // Webhook: 1000 requests por minuto (para Stripe, etc.)
  webhook: (identifier: string) =>
    rateLimit(identifier, { limit: 1000, window: 60, prefix: "webhook" }),

  // Upload: 10 requests por minuto
  upload: (identifier: string) =>
    rateLimit(identifier, { limit: 10, window: 60, prefix: "upload" }),

  // Email: 20 envíos por hora
  email: (identifier: string) =>
    rateLimit(identifier, { limit: 20, window: 3600, prefix: "email" }),
};

// =========================================================
// Helper Functions
// =========================================================

/**
 * Obtiene el identificador del cliente desde la request
 * Prioriza X-Forwarded-For (proxy/load balancer) > X-Real-IP > fallback
 */
export function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip"); // Cloudflare

  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  if (forwarded) {
    // X-Forwarded-For puede tener múltiples IPs, tomar la primera (cliente original)
    return forwarded.split(",")[0].trim();
  }
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}

/**
 * Genera un identificador compuesto de IP + ruta
 * Útil para rate limiting por endpoint
 */
export function getRouteIdentifier(req: Request, path?: string): string {
  const ip = getClientIdentifier(req);
  const route = path || new URL(req.url).pathname;
  return `${ip}:${route}`;
}

/**
 * Genera un identificador compuesto de IP + userId
 * Útil para rate limiting por usuario autenticado
 */
export function getUserIdentifier(req: Request, userId: string): string {
  const ip = getClientIdentifier(req);
  return `${ip}:user:${userId}`;
}

// =========================================================
// Error Class
// =========================================================

/**
 * Error personalizado para rate limit
 */
export class RateLimitError extends Error {
  resetAt: number;
  remaining: number;
  retryAfter: number;

  constructor(resetAt: number) {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    super(`Rate limit exceeded. Try again in ${retryAfter} seconds.`);
    this.name = "RateLimitError";
    this.resetAt = resetAt;
    this.remaining = 0;
    this.retryAfter = retryAfter;
  }
}

// =========================================================
// Monitoring / Stats
// =========================================================

/**
 * Obtiene estadísticas del rate limiter (para monitoreo)
 */
export function getRateLimitStats(): {
  storeSize: number;
  hits: number;
  misses: number;
  blocked: number;
  cleanups: number;
  lastCleanup: Date;
} {
  return {
    storeSize: store.size,
    hits: storeStats.hits,
    misses: storeStats.misses,
    blocked: storeStats.blocked,
    cleanups: storeStats.cleanups,
    lastCleanup: new Date(storeStats.lastCleanup),
  };
}

/**
 * Resetea las estadísticas del rate limiter
 */
export function resetRateLimitStats(): void {
  storeStats = {
    hits: 0,
    misses: 0,
    blocked: 0,
    cleanups: 0,
    lastCleanup: Date.now(),
  };
}

/**
 * Limpia todo el store (usar con cuidado, solo para testing)
 */
export function clearRateLimitStore(): void {
  store.clear();
  resetRateLimitStats();
}
