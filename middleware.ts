// middleware.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { ADMIN_MFA_COOKIE, verifyAdminMfaCookieEdge } from "@/lib/admin-mfa/edge";

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
  // Recuperación de cuenta — el usuario NO está logueado en estos flujos,
  // así que tienen que ser públicos o el reset de contraseña / verificación
  // de email rebota a /signin.
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  // Documentos legales — públicos por diseño (accesibles e indexables).
  "/legal",
  "/contact",
  "/pricing",
  "/how-it-works",
  "/for-organizations",
  "/for-you",
  "/product",
  "/demo",
  "/pitch",
  "/about",
  "/stories",
  "/resources",
  "/pre-sei", // Pre-SEI: diagnóstico EQ público (gancho EQ Day)
  "/r", // Invitación relacional: deep link público del invitado (HOOK SIA)
];

const PUBLIC_API_PATHS = [
  "/api/auth",
  "/api/i18n",
  "/api/public",
  "/api/plans",
  "/api/health", // Health check for monitoring
  "/api/cron", // Cron jobs (secured by CRON_SECRET)
  "/api/admin/benchmarks", // All benchmark APIs (auth handled internally)
  // Webhooks externos — autenticados por firma (Stripe) o secret, no por
  // sesión NextAuth. Sin esto el middleware devuelve 401 a Stripe y los
  // eventos nunca llegan al handler. La verificación de firma sucede
  // dentro de cada route. NOTA: solo el webhook es público; /api/stripe/
  // checkout y /portal siguen requiriendo sesión.
  "/api/stripe/webhook",
  "/api/webhooks",
  // Slack — events/commands se autentican por firma HMAC; callback por
  // state anti-CSRF. Slack las llama sin sesión NextAuth, así que sin
  // esto el middleware devuelve 401. /install NO va aquí: requiere sesión.
  "/api/integrations/slack/events",
  "/api/integrations/slack/commands",
  "/api/integrations/slack/callback",
  // WhatsApp — webhook entrante de Twilio, autenticado por firma
  // X-Twilio-Signature. Twilio lo llama sin sesión NextAuth.
  "/api/integrations/whatsapp/webhook",
];

/* =========================================================
   🌐 Rutas de API que son PUNTOS DE ENTRADA DE NAVEGACIÓN
   ---------------------------------------------------------
   Un humano abre estas URLs directamente en el navegador (no son fetch
   de la SPA). Si no hay sesión, el middleware debe MANDARLAS A /signin
   con callbackUrl — NO devolver 401 JSON crudo (que es lo que un usuario
   veía al hacer clic en "Conectar Slack" sin sesión). Tras autenticarse,
   el callbackUrl los devuelve al flujo OAuth.
========================================================= */
const API_NAV_ENTRYPOINTS = [
  "/api/integrations/slack/install",
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

// Webhooks externos autenticados por FIRMA (no por sesión) que NO deben pasar
// por el rate limit por IP: Stripe/Twilio/Slack envían desde pools de IPs y un
// burst de eventos legítimos (o reintentos) en la misma ventana de 60s podría
// disparar un 429 — para Stripe eso significa pagos que no se activan. La firma
// ya es la defensa correcta aquí; el rate limit por IP solo añade riesgo.
const RATE_LIMIT_EXEMPT_PATHS = [
  "/api/stripe/webhook",
  "/api/webhooks",
  "/api/integrations/slack/events",
  "/api/integrations/slack/commands",
  "/api/integrations/whatsapp/webhook",
];

// APIs que no requieren verificación de origen (webhooks externos)
const CSRF_EXEMPT_PATHS = [
  "/api/stripe/webhook",
  "/api/webhooks",
  "/api/cron",
  "/api/auth", // NextAuth maneja su propia seguridad
  "/api/admin/benchmarks/blob-token", // Vercel Blob multipart upload callbacks
  "/api/admin/benchmarks/process-blob", // Internal service-to-service processing
  "/api/integrations/slack/events", // Slack server-to-server (signature-verified)
  "/api/integrations/slack/commands", // Slack slash commands (signature-verified)
  "/api/integrations/whatsapp/webhook", // Twilio WhatsApp inbound (signature-verified)
];

// Hosts permitidos para CSRF (configurar según entorno)
const ALLOWED_HOSTS = [
  "localhost",
  "localhost:3000",
  "rowi.app",
  "www.rowi.app",
  "rowiia.com",
  "www.rowiia.com",
  process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") || "",
].filter(Boolean);

/* =========================================================
   🛡️ RATE LIMITING (In-memory for Edge Runtime)
========================================================= */

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// ⚠️ DEUDA TÉCNICA (post-launch): este store es un Map in-memory por
// instancia serverless. En Vercel con N instancias, el límite efectivo es
// ~N× el configurado y se reinicia en cold starts. Es una defensa básica,
// NO un control de costo robusto. Para los endpoints de IA (sensibles a
// costo) conviene migrar a un store compartido (Upstash/Redis) cuando haya
// margen. Mientras tanto, los límites de IA se mantienen estrictos abajo y
// cada endpoint de IA tiene además max_tokens acotado en su handler.

// Rate limit configs (requests per minute)
const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/auth": { limit: 10, windowMs: 60000 }, // Auth: 10/min
  "/api/rowi": { limit: 20, windowMs: 60000 }, // AI Chat: 20/min (cost-control)
  "/api/eco": { limit: 20, windowMs: 60000 }, // AI Eco: 20/min (cost-control)
  "/api/affinity": { limit: 20, windowMs: 60000 }, // AI Affinity: 20/min (cost-control)
  "/api/hub/insights": { limit: 15, windowMs: 60000 }, // AI Insights: 15/min
  "/api/hub/knowledge": { limit: 20, windowMs: 60000 }, // AI Knowledge summarize: 20/min
  "/api/ai": { limit: 20, windowMs: 60000 }, // AI genérico: 20/min
  "/api/admin/benchmarks/blob-token": { limit: 200, windowMs: 60000 }, // Blob upload: 200/min (multipart chunks)
  "/api/admin/benchmarks/job": { limit: 120, windowMs: 60000 }, // Job polling: 120/min
  "/api/admin": { limit: 50, windowMs: 60000 }, // Admin: 50/min
  "/api/stripe": { limit: 10, windowMs: 60000 }, // Stripe: 10/min
  "/api/public/pre-sei": { limit: 10, windowMs: 60000 }, // Pre-SEI público sin auth: 10/min anti-abuso
  default: { limit: 100, windowMs: 60000 }, // Default: 100/min
};

// Devuelve el prefijo de RATE_LIMITS más específico (el más largo) que
// matchea el pathname. Así /api/hub/insights no cae en el cubo de /api/hub.
function matchRateLimitPrefix(pathname: string): string {
  let best = "default";
  let bestLen = -1;
  for (const prefix of Object.keys(RATE_LIMITS)) {
    if (prefix === "default") continue;
    if (pathname.startsWith(prefix) && prefix.length > bestLen) {
      best = prefix;
      bestLen = prefix.length;
    }
  }
  return best;
}

function getRateLimitKey(req: NextRequest, prefix: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  // La clave se ata al prefijo que matcheó el config, no a los 2 primeros
  // segmentos: así cada bucket tiene su propia ventana.
  const bucket = prefix === "default"
    ? req.nextUrl.pathname.split("/").slice(0, 3).join("/")
    : prefix;
  return `${ip}:${bucket}`;
}

function getRateLimitConfig(prefix: string) {
  return RATE_LIMITS[prefix] ?? RATE_LIMITS.default;
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
  if (
    pathname.startsWith("/api/") &&
    !RATE_LIMIT_EXEMPT_PATHS.some((p) => pathname.startsWith(p))
  ) {
    cleanupExpiredEntries();

    const prefix = matchRateLimitPrefix(pathname);
    const key = getRateLimitKey(req, prefix);
    const config = getRateLimitConfig(prefix);
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

    // 🛡️ Exigir Origin o Referer en mutaciones no exentas. Un navegador real
    // siempre envía al menos uno en un POST autenticado por cookie; la
    // ausencia de ambos es precisamente el vector CSRF que queremos cerrar.
    // Los callers server-to-server legítimos (Stripe, cron, Slack, WhatsApp,
    // NextAuth) ya están en CSRF_EXEMPT_PATHS y verifican firma aparte.
    if (!requestOriginHost) {
      console.warn(`🛡️ CSRF blocked: missing origin/referer, host=${host}, path=${pathname}`);
      return NextResponse.json(
        { ok: false, error: "Missing request origin" },
        { status: 403 }
      );
    }

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
    const isApiNavEntrypoint = API_NAV_ENTRYPOINTS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
    // Para APIs normales (fetch de la SPA), devolver 401 JSON.
    // EXCEPCIÓN: las entradas de navegación (p.ej. /slack/install) las abre
    // un humano en el browser → redirigir a /signin para no mostrar JSON crudo.
    if (pathname.startsWith("/api/") && !isApiNavEntrypoint) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Para páginas y entradas de navegación, redirigir a signin
    const signin = new URL("/signin", req.url);
    signin.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signin);
  }

  /* =========================================================
     4.5) 🔐 GATE MFA PARA EL PANEL ADMIN
     Antes de evaluar roles: si esto es una PÁGINA /hub/admin/* y el
     usuario aún no verificó el segundo factor (cookie firmada
     rowi_admin_mfa), lo mandamos a la pantalla de verificación.
     - No aplica a /api/* (los endpoints admin tienen sus propios
       guards y el endpoint de MFA debe poder llamarse).
     - No aplica a la propia página de verificación (evita loop).
     - Se salta por completo si ADMIN_MFA_BYPASS === "true".
  ========================================================== */
  if (
    process.env.ADMIN_MFA_BYPASS !== "true" &&
    pathname.startsWith(ADMIN_PATH) &&
    !pathname.startsWith(`${ADMIN_PATH}/mfa`) &&
    !pathname.startsWith(`${ADMIN_PATH}/unauthorized`)
  ) {
    const userId = (token as any).sub || (token as any).id || "";
    const mfaCookie = req.cookies.get(ADMIN_MFA_COOKIE)?.value;
    if (!userId || !(await verifyAdminMfaCookieEdge(mfaCookie, userId))) {
      const url = new URL(`${ADMIN_PATH}/mfa`, req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
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

  // Verificar si es SuperAdmin por cualquier método (case-insensitive)
  const normalizedOrgRole = organizationRole.toString().toUpperCase().replace(/[^A-Z]/g, "");
  const isSuperAdmin =
    isSuperAdminFlag ||
    normalizedOrgRole === "SUPERADMIN" ||
    isInHubAdmins ||
    permissions.some(
      (p: any) =>
        p.role?.toLowerCase() === "superadmin" &&
        p.scopeType === "rowiverse"
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
