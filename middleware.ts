// middleware.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/* =========================================================
   🌍 CONFIG — Rutas especiales
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
   - Protege /hub/admin
   - Permite a usuarios normales usar toda la app
   - Habilita IA para usuarios loggeados
========================================================= */

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* =========================================================
     1) Ignorar rutas públicas y de sistema
  ========================================================== */
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  /* =========================================================
     2) Obtener token NextAuth
  ========================================================== */
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuth = !!token;

  /* =========================================================
     3) Permitir a usuarios NO loggeados:
        - Landing page
        - Signin
        - Registro
        - Página principal pública
        - API de autenticación NextAuth
  ========================================================== */
  if (
    pathname === "/" ||
    pathname.startsWith("/signin") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  /* =========================================================
     4) Si el usuario NO está autenticado → redirigir a login
  ========================================================== */
  if (!isAuth) {
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
    // Usuario normal → acceso permitido
    return NextResponse.next();
  }

  /* =========================================================
     8) Validación para admin normal
     Revisa si tiene permisos de superhub, tenant o hub
  ========================================================== */
  const hasAdminAccess = permissions.some((p: any) =>
    ["superhub", "tenant", "hub"].includes(p.scopeType)
  );

  if (!hasAdminAccess) {
    // No tiene acceso al admin panel → enviar a "Unauthorized"
    const url = new URL("/hub/admin/unauthorized", req.url);
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

/* =========================================================
   9) MATCHER — protege SOLO lo que necesitamos
========================================================= */

export const config = {
  matcher: [
    "/((?!_next|static|favicon.ico|api/public|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.webp$|.*\\.ico$|.*\\.gif$).*)",
  ],
};