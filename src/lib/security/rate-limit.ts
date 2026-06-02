/**
 * Simple in-memory rate limiter for API routes.
 *
 * `checkRateLimit` is SYNCHRONOUS (and in-memory) by design — it is
 * the stable, test-covered core. For a distributed limit shared
 * across serverless instances use `checkRateLimitDistributed`
 * (async), which talks to Upstash Redis when configured and falls
 * back to this same in-memory store otherwise.
 *
 * DISTRIBUTED BACKEND (optional) — set BOTH env vars to activate:
 *   UPSTASH_REDIS_REST_URL    = https://<region>.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN  = <REST token>
 * Missing either → in-memory (identical to legacy behavior). Redis
 * failures fail-open to in-memory. See `./redisRateLimit.ts`.
 */

import {
  isRedisRateLimitEnabled,
  redisIncrWindow,
} from "./redisRateLimit";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // If no entry or expired, create new one
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      success: true,
      remaining: config.limit - 1,
      resetIn: config.windowSeconds,
    };
  }

  // Increment count
  entry.count++;

  // Check if over limit
  if (entry.count > config.limit) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetIn,
    };
  }

  return {
    success: true,
    remaining: config.limit - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
  };
}

/**
 * Distributed-aware rate limit check.
 *
 * Identical contract to `checkRateLimit`, but async: when Upstash
 * Redis is configured (both env vars present) the counter is shared
 * across every serverless instance. When it is NOT configured — or
 * if a Redis call throws/times out — this falls back to the
 * synchronous in-memory `checkRateLimit`, so behavior is unchanged
 * pre-launch and the limiter never takes down the API (fail-open).
 *
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 */
export async function checkRateLimitDistributed(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (isRedisRateLimitEnabled()) {
    const windowMs = config.windowSeconds * 1000;
    const r = await redisIncrWindow(`rl:${identifier}`, windowMs);
    if (r) {
      const success = r.count <= config.limit;
      return {
        success,
        remaining: Math.max(0, config.limit - r.count),
        resetIn: Math.max(0, Math.ceil((r.resetAt - Date.now()) / 1000)),
      };
    }
    // r === null → fall through to in-memory (fail-open).
  }

  return checkRateLimit(identifier, config);
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return "unknown";
}

// Preset configurations for common use cases
export const RATE_LIMITS = {
  /** Strict limit for authentication endpoints: 5 requests per minute */
  AUTH: { limit: 5, windowSeconds: 60 },

  /** Standard API limit: 100 requests per minute */
  API: { limit: 100, windowSeconds: 60 },

  /** Relaxed limit for read-only endpoints: 200 requests per minute */
  READ: { limit: 200, windowSeconds: 60 },

  /** Very strict limit for sensitive operations: 3 requests per minute */
  SENSITIVE: { limit: 3, windowSeconds: 60 },

  /** AI/Chat endpoints: 20 requests per minute */
  AI: { limit: 20, windowSeconds: 60 },
} as const;
