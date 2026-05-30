// src/app/api/admin/mfa/verify/route.ts
// ============================================================
// Verifica el código OTP de admin y, si es correcto, setea la cookie
// firmada `rowi_admin_mfa` que el guard del layout admin exige.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { checkRateLimit, getClientIP } from "@/lib/security/rate-limit";
import {
  ADMIN_MFA_COOKIE,
  ADMIN_MFA_SESSION_MS,
  ADMIN_OTP_MAX_ATTEMPTS,
  buildAdminMfaCookieValue,
  adminMfaBypassEnabled,
} from "@/lib/admin-mfa";

export const runtime = "nodejs";

function setMfaCookie(res: NextResponse, userId: string) {
  res.cookies.set(ADMIN_MFA_COOKIE, buildAdminMfaCookieValue(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(ADMIN_MFA_SESSION_MS / 1000),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;
  const user = auth.user;

  // Bypass de emergencia: setea la cookie sin pedir código.
  if (adminMfaBypassEnabled()) {
    const res = NextResponse.json({ ok: true, bypass: true });
    setMfaCookie(res, user.id);
    return res;
  }

  // Anti fuerza bruta por usuario + IP.
  const rl = checkRateLimit(`admin-otp-verify:${user.id}`, { limit: 10, windowSeconds: 600 });
  if (!rl.success) {
    return NextResponse.json({ ok: false, error: "Demasiados intentos." }, { status: 429 });
  }
  const ipRl = checkRateLimit(`admin-otp-verify-ip:${getClientIP(req)}`, { limit: 20, windowSeconds: 600 });
  if (!ipRl.success) {
    return NextResponse.json({ ok: false, error: "Demasiados intentos." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const code = String(body.code || "").trim();
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, error: "Código inválido." }, { status: 400 });
  }

  const token = await prisma.adminOtpToken.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "No hay un código activo. Pide uno nuevo." },
      { status: 400 },
    );
  }

  if (token.attempts >= ADMIN_OTP_MAX_ATTEMPTS) {
    await prisma.adminOtpToken.delete({ where: { id: token.id } });
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos fallidos. Pide un código nuevo." },
      { status: 429 },
    );
  }

  if (token.expiresAt < new Date()) {
    return NextResponse.json(
      { ok: false, error: "El código expiró. Pide uno nuevo." },
      { status: 400 },
    );
  }

  if (token.code !== code) {
    await prisma.adminOtpToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json({ ok: false, error: "Código incorrecto." }, { status: 400 });
  }

  // Correcto: marcar usado y setear la cookie de sesión MFA.
  await prisma.adminOtpToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });

  const res = NextResponse.json({ ok: true });
  setMfaCookie(res, user.id);
  return res;
}
