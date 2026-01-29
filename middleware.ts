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
];

const PUBLIC_API_PATHS = [
  "/api/auth",
  "/api/i18n",
  "/api/public",
  "/api/plans",
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

/* =========================================================
   🔥 MIDDLEWARE PRINCIPAL
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
  ========================================================== */
  const permissions = (token as any).permissions || [];

  const isSuperAdmin = permissions.some(
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
