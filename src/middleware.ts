// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 🌍 Middleware de acceso global (producción)
 * - Permite el acceso público a todo excepto /hub/*
 * - Protege las rutas del hub para usuarios autenticados
 * - Evita bucles de redirección
 */
export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // ⚙️ Permitir archivos estáticos, API y recursos internos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
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