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
  buildAdminMfaCookieValue,
  adminMfaBypassEnabled,
} from "@/lib/admin-mfa";
import { decryptTotpSecret, verifyTotpCode } from "@/lib/admin-mfa/totp";

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

  // Lee el secreto TOTP del usuario (cifrado en reposo).
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { mfaTotpSecret: true, mfaEnabledAt: true },
  });

  if (!dbUser?.mfaTotpSecret) {
    return NextResponse.json(
      { ok: false, error: "No has configurado el autenticador. Escanea el QR primero." },
      { status: 400 },
    );
  }

  let secret: string;
  try {
    secret = decryptTotpSecret(dbUser.mfaTotpSecret);
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo validar el secreto. Reconfigura el autenticador." },
      { status: 500 },
    );
  }

  if (!verifyTotpCode(code, secret)) {
    return NextResponse.json({ ok: false, error: "Código incorrecto." }, { status: 400 });
  }

  // Correcto. Si es la primera verificación, confirma el enroll.
  if (!dbUser.mfaEnabledAt) {
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabledAt: new Date() },
    });
  }

  const res = NextResponse.json({ ok: true });
  setMfaCookie(res, user.id);
  return res;
}
