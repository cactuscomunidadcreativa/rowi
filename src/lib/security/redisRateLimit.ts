/**
 * =========================================================
 * 🛡️ Distributed rate-limit backend — Upstash REST (fetch)
 * =========================================================
 *
 * Backend distribuido compartido por los dos rate limiters de la
 * app (`rateLimit.ts` y `rate-limit.ts`). Habla con Upstash Redis
 * directamente vía su REST API usando `fetch`, SIN depender de
 * ningún paquete npm — así el build de Vercel nunca falla por una
 * dependencia ausente y el bundle queda libre de imports pesados.
 *
 * ACTIVACIÓN (las dos variables deben estar presentes):
 *   UPSTASH_REDIS_REST_URL    = https://<region>.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN  = <REST token>
 *
 * Si CUALQUIERA falta → `isRedisRateLimitEnabled()` es false y los
 * limiters caen al store en memoria de siempre (cero cambios de
 * comportamiento pre-launch).
 *
 * FAIL-OPEN: si una llamada a Redis lanza o expira, el llamador
 * captura `null` y cae al store en memoria. Un rate limiter nunca
 * debe tumbar la API.
 *
 * Algoritmo: contador de ventana fija (INCR + PEXPIRE en el primer
 * hit de la ventana, en un solo round-trip vía pipeline). Reproduce
 * la semántica del store en memoria existente, ahora compartida
 * entre todas las instancias serverless.
 */

import { secureLog } from "@/lib/logging/secureLogger";

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Timeout defensivo: si Redis tarda, fail-open rápido en vez de
// colgar el request.
const REDIS_TIMEOUT_MS = Number(process.env.UPSTASH_REDIS_TIMEOUT_MS) || 1000;

/**
 * Resultado normalizado del backend distribuido.
 * `count` es el número de hits en la ventana actual (post-incremento).
 * `resetAt` es el epoch-ms en que la ventana expira.
 */
export interface RedisRateLimitResult {
  count: number;
  resetAt: number;
}

/**
 * ¿Está configurado el backend distribuido? Las DOS env vars deben
 * estar presentes. Si no, los limiters usan memoria (comportamiento
 * idéntico al actual).
 */
export function isRedisRateLimitEnabled(): boolean {
  return !!(REST_URL && REST_TOKEN);
}

/**
 * Ejecuta un pipeline de comandos contra la REST API de Upstash.
 * Devuelve el array de resultados crudos, o `null` si falla / timeout
 * (el llamador hace fail-open hacia memoria).
 */
async function pipeline(commands: Array<Array<string | number>>): Promise<unknown[] | null> {
  if (!REST_URL || !REST_TOKEN) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REDIS_TIMEOUT_MS);

  try {
    const res = await fetch(`${REST_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      secureLog.warn("rate_limit.redis_http_error", { status: res.status });
      return null;
    }

    // Upstash pipeline → [{ result }, { error }, ...]
    const json = (await res.json()) as Array<{ result?: unknown; error?: string }>;
    if (!Array.isArray(json)) return null;

    for (const item of json) {
      if (item && typeof item === "object" && "error" in item && item.error) {
        secureLog.warn("rate_limit.redis_cmd_error", { error: String(item.error) });
        return null;
      }
    }
    return json.map((item) => item?.result);
  } catch (error) {
    // AbortError (timeout) u otro fallo de red → fail-open.
    secureLog.warn("rate_limit.redis_unreachable", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Incrementa el contador de la ventana para `key` de forma atómica y
 * distribuida. En el primer hit de la ventana fija el TTL (PEXPIRE).
 *
 * @param key      Clave completa (debe incluir su prefijo).
 * @param windowMs Tamaño de la ventana en milisegundos.
 * @returns Resultado normalizado, o `null` si Redis no está disponible
 *          (el llamador cae a memoria).
 */
export async function redisIncrWindow(
  key: string,
  windowMs: number
): Promise<RedisRateLimitResult | null> {
  if (!isRedisRateLimitEnabled()) return null;

  // INCR devuelve el nuevo conteo. Si es 1 es el primer hit de la
  // ventana → fijamos el TTL. PTTL nos da el tiempo restante para
  // calcular resetAt de forma consistente entre instancias.
  const results = await pipeline([
    ["INCR", key],
    ["PEXPIRE", key, windowMs, "NX"], // NX: solo fija TTL si no existe
    ["PTTL", key],
  ]);

  if (!results || results.length < 3) return null;

  const count = Number(results[0]);
  let pttl = Number(results[2]);

  if (!Number.isFinite(count)) return null;

  // PTTL < 0 significa sin expiración fijada (carrera rara); usamos
  // la ventana completa como salvaguarda.
  if (!Number.isFinite(pttl) || pttl < 0) {
    pttl = windowMs;
  }

  return {
    count,
    resetAt: Date.now() + pttl,
  };
}
