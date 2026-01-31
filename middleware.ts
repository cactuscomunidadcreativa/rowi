// middleware.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/* =========================================================
   🌍 CONFIG — Rutas públicas de promoción/landing
========================================================= */

const PUBLIC_PAGES = [
  "/",
  "/signin",
  "/login",
  "/register",
  "/invite",
  "/auth",
  "/contact",
  "/pricing",
  "/how-it-works",
  "/for-organizations",
  "/for-you",
  "/product",
  "/demo",
];

const PUBLIC_API_PATHS = [
  "/api/auth",
  "/api/i18n",
  "/api/public",
  "/api/plans",
  "/api/health", // Health check for monitoring
  "/api/cron", // Cron jobs (secured by CRON_SECRET)
];

/* =========================================================
   🔒 CONFIG — Rutas protegidas (requieren permisos especiales)
========================================================= */

const ADMIN_PATH = "/hub/admin";
const IA_PATHS = [
  "/api/rowi",
  "/api/eco",
  "/api/affinity",
  "/api/emotions",
  "/api/hub/ai",
];

// APIs que no requieren verificación de origen (webhooks externos)
const CSRF_EXEMPT_PATHS = [
  "/api/stripe/webhook",
  "/api/webhooks",
  "/api/cron",
  "/api/auth", // NextAuth maneja su propia seguridad
];

// Hosts permitidos para CSRF (configurar según entorno)
const ALLOWED_HOSTS = [
  "localhost",
  "localhost:3000",
  "rowi.app",
  "www.rowi.app",
  process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") || "",
].filter(Boolean);

/* =========================================================
   🛡️ RATE LIMITING (In-memory for Edge Runtime)
========================================================= */

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configs (requests per minute)
const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/auth": { limit: 10, windowMs: 60000 }, // Auth: 10/min
  "/api/rowi": { limit: 30, windowMs: 60000 }, // AI Chat: 30/min
  "/api/eco": { limit: 30, windowMs: 60000 }, // AI Eco: 30/min
  "/api/affinity": { limit: 30, windowMs: 60000 }, // AI Affinity: 30/min
  "/api/admin": { limit: 50, windowMs: 60000 }, // Admin: 50/min
  "/api/stripe": { limit: 10, windowMs: 60000 }, // Stripe: 10/min
  default: { limit: 100, windowMs: 60000 }, // Default: 100/min
};

function getRateLimitKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `${ip}:${req.nextUrl.pathname.split("/").slice(0, 3).join("/")}`;
}

function getRateLimitConfig(pathname: string) {
  for (const [prefix, config] of Object.entries(RATE_LIMITS)) {
    if (prefix !== "default" && pathname.startsWith(prefix)) {
      return config;
    }
  }
  return RATE_LIMITS.default;
}

function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  // Clean expired entry
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(key);
    entry = undefined;
  }

  if (!entry) {
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: limit - 1, resetAt: resetTime };
  }

  entry.count++;
  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetTime };
  }

  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetTime };
}

// Limpiar entradas expiradas periódicamente (cada 60 segundos)
let lastCleanup = Date.now();
function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/* =========================================================
   🔥 MIDDLEWARE PRINCIPAL
   - Rate limiting para APIs
   - Páginas de promoción son públicas
   - El resto requiere autenticación
   - /hub/admin requiere permisos especiales
========================================================= */

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* =========================================================
     1) Ignorar rutas de sistema (siempre públicas)
  ========================================================== */
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  /* =========================================================
     2) 🛡️ RATE LIMITING para todas las APIs
  ========================================================== */
  if (pathname.startsWith("/api/")) {
    cleanupExpiredEntries();

    const key = getRateLimitKey(req);
    const config = getRateLimitConfig(pathname);
    const { allowed, remaining, resetAt } = checkRateLimit(key, config.limit, config.windowMs);

    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(resetAt),
          },
        }
      );
    }

    // Continuar con la verificación de autenticación pero agregar headers de rate limit
    const response = await processRequest(req, pathname);
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    return response;
  }

  /* =========================================================
     3) Para páginas (no API), no aplicar rate limit
  ========================================================== */
  return processRequest(req, pathname);
}

async function processRequest(req: NextRequest, pathname: string): Promise<NextResponse> {
  /* =========================================================
     1.5) 🛡️ CSRF Protection para métodos de escritura
     ---------------------------------------------------------
     Verifica que el Origin/Referer coincida con hosts permitidos
     para prevenir ataques CSRF en mutaciones.
  ========================================================== */
  const method = req.method;
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const isApiRoute = pathname.startsWith("/api/");
  const isCsrfExempt = CSRF_EXEMPT_PATHS.some((p) => pathname.startsWith(p));

  if (isMutation && isApiRoute && !isCsrfExempt) {
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const host = req.headers.get("host") || "";

    // Obtener el host del origin o referer
    let requestOriginHost = "";
    if (origin) {
      try {
        requestOriginHost = new URL(origin).host;
      } catch {
        // Origin inválido
      }
    } else if (referer) {
      try {
        requestOriginHost = new URL(referer).host;
      } catch {
        // Referer inválido
      }
    }

    // Si hay origin/referer, verificar que coincida
    if (requestOriginHost) {
      const isAllowed =
        requestOriginHost === host ||
        ALLOWED_HOSTS.includes(requestOriginHost) ||
        requestOriginHost.endsWith(".rowi.app"); // Subdominios de rowi.app

      if (!isAllowed) {
        console.warn(`🛡️ CSRF blocked: origin=${requestOriginHost}, host=${host}, path=${pathname}`);
        return NextResponse.json(
          { ok: false, error: "Invalid request origin" },
          { status: 403 }
        );
      }
    }
    // Si no hay origin ni referer, permitir (puede ser fetch sin credentials)
  }

  /* =========================================================
     2) Verificar si es una página/API pública
  ========================================================== */
  const isPublicPage = PUBLIC_PAGES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isPublicApi = PUBLIC_API_PATHS.some((p) => pathname.startsWith(p));

  if (isPublicPage || isPublicApi) {
    return NextResponse.next();
  }

  /* =========================================================
     3) Obtener token NextAuth
  ========================================================== */
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuth = !!token;

  /* =========================================================
     4) Si no está autenticado → redirigir a login
  ========================================================== */
  if (!isAuth) {
    // Para APIs, devolver 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Para páginas, redirigir a signin
    const signin = new URL("/signin", req.url);
    signin.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signin);
  }

  /* =========================================================
     5) IA — permitir todas las llamadas a IA para usuarios loggeados
  ========================================================== */
  if (IA_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  /* =========================================================
     6) SUPERADMIN — acceso total
     Verificar múltiples fuentes:
     - isSuperAdmin flag del token
     - organizationRole SUPER_ADMIN/SUPERADMIN
     - permissions con role superadmin
     - HUB_ADMINS env variable
  ========================================================== */
  const permissions = (token as any).permissions || [];
  const email = ((token as any).email || "").toLowerCase();
  const organizationRole = (token as any).organizationRole || "";
  const isSuperAdminFlag = (token as any).isSuperAdmin === true;

  // Verificar HUB_ADMINS (variable de entorno)
  const hubAdmins = process.env.HUB_ADMINS || "";
  const adminEmails = hubAdmins.split(",").map((e: string) => e.trim().toLowerCase()).filter(Boolean);
  const isInHubAdmins = email && adminEmails.includes(email);

  // Verificar si es SuperAdmin por cualquier método
  const isSuperAdmin =
    isSuperAdminFlag ||
    organizationRole === "SUPER_ADMIN" ||
    organizationRole === "SUPERADMIN" ||
    isInHubAdmins ||
    permissions.some(
      (p: any) =>
        p.role === "superadmin" &&
        p.scopeType === "rowiverse" &&
        p.scopeId === "rowiverse_root"
    );

  if (isSuperAdmin) {
    return NextResponse.next();
  }

  /* =========================================================
     7) Usuario normal — puede usar TODA LA APP excepto /hub/admin
  ========================================================== */
  const isAdminRoute = pathname.startsWith(ADMIN_PATH);

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  /* =========================================================
     8) Validación para admin normal
  ========================================================== */
  const hasAdminAccess = permissions.some((p: any) =>
    ["superhub", "tenant", "hub"].includes(p.scopeType)
  );

  if (!hasAdminAccess) {
    const url = new URL("/hub/admin/unauthorized", req.url);
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

/* =========================================================
   9) MATCHER — excluir archivos estáticos
========================================================= */

export const config = {
  matcher: [
    "/((?!_next|static|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.webp$|.*\\.ico$|.*\\.gif$).*)",
  ],
};
