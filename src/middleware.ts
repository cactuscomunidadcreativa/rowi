// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ============================================
// 🔒 RATE LIMITING (In-memory for Edge Runtime)
// ============================================
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `${ip}:${req.nextUrl.pathname}`;
}

function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  // Clean expired entry
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(key);
    entry = undefined;
  }

  if (!entry) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  entry.count++;
  if (entry.count > limit) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: limit - entry.count };
}

// Rate limit configs (requests per minute)
const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/auth": { limit: 10, windowMs: 60000 }, // Auth: 10/min
  "/api/rowi": { limit: 30, windowMs: 60000 }, // AI Chat: 30/min
  "/api/admin": { limit: 50, windowMs: 60000 }, // Admin: 50/min
  default: { limit: 100, windowMs: 60000 }, // Default: 100/min
};

function getRateLimitConfig(pathname: string) {
  for (const [prefix, config] of Object.entries(RATE_LIMITS)) {
    if (prefix !== "default" && pathname.startsWith(prefix)) {
      return config;
    }
  }
  return RATE_LIMITS.default;
}

/**
 * 🌍 Middleware de acceso global (producción)
 * - Rate limiting para APIs
 * - Permite el acceso público a todo excepto /hub/*
 * - Protege las rutas del hub para usuarios autenticados
 * - Evita bucles de redirección
 */
export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // ⚙️ Permitir archivos estáticos y recursos internos
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 🔒 Rate limiting para rutas API
  if (pathname.startsWith("/api")) {
    const key = getRateLimitKey(req);
    const config = getRateLimitConfig(pathname);
    const { allowed, remaining } = checkRateLimit(key, config.limit, config.windowMs);

    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    return response;
  }

  // 🧭 Acceso público total fuera del hub
  if (!pathname.startsWith("/hub")) {
    return NextResponse.next();
  }

  // 🔒 Solo autenticados pueden entrar a /hub/*
  const token =
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!token) {
    const loginUrl = new URL("/signin", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|public).*)"],
};