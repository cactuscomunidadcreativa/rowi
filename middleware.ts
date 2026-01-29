// middleware.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/* =========================================================
   🌍 CONFIG — Rutas que REQUIEREN autenticación
========================================================= */

// Rutas que requieren estar logueado
const PROTECTED_PATHS = [
  "/hub/admin",
  "/dashboard",
  "/profile",
  "/settings",
];

// APIs que requieren autenticación
const PROTECTED_API_PATHS = [
  "/api/rowi",
  "/api/eco",
  "/api/affinity",
  "/api/emotions",
  "/api/hub/ai",
  "/api/hub/admin",
  "/api/admin",
];

/* =========================================================
   🔥 MIDDLEWARE PRINCIPAL
   - Por defecto TODO es público
   - Solo protege rutas específicas que requieren auth
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
     2) Verificar si la ruta requiere autenticación
  ========================================================== */
  const requiresAuth =
    PROTECTED_PATHS.some((p) => pathname.startsWith(p)) ||
    PROTECTED_API_PATHS.some((p) => pathname.startsWith(p));

  // Si no requiere auth, permitir acceso
  if (!requiresAuth) {
    return NextResponse.next();
  }

  /* =========================================================
     3) Obtener token NextAuth (solo si la ruta requiere auth)
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    // Para páginas, redirigir a signin
    const signin = new URL("/signin", req.url);
    signin.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signin);
  }

  /* =========================================================
     5) SUPERADMIN — acceso total
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
     6) Validación para /hub/admin
  ========================================================== */
  if (pathname.startsWith("/hub/admin")) {
    const hasAdminAccess = permissions.some((p: any) =>
      ["superhub", "tenant", "hub"].includes(p.scopeType)
    );

    if (!hasAdminAccess) {
      const url = new URL("/hub/admin/unauthorized", req.url);
      return NextResponse.rewrite(url);
    }
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
