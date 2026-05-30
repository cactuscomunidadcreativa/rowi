// src/app/api/admin/mfa/send/route.ts
// ============================================================
// Genera y envía por email un código OTP para acceder al panel admin.
// 🔐 Solo usuarios que ya son admin (sesión válida). El gate es
// ADICIONAL al login — no lo reemplaza.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { checkRateLimit, getClientIP } from "@/lib/security/rate-limit";
import { sendAdminOtpEmail } from "@/lib/email/sendAdminOtpEmail";
import {
  generateAdminOtp,
  ADMIN_OTP_TTL_MS,
  adminMfaBypassEnabled,
} from "@/lib/admin-mfa";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;
  const user = auth.user;

  // Si el bypass de emergencia está activo, no hace falta enviar nada.
  if (adminMfaBypassEnabled()) {
    return NextResponse.json({ ok: true, bypass: true });
  }

  if (!user.email) {
    return NextResponse.json(
      { ok: false, error: "Tu cuenta no tiene email para recibir el código." },
      { status: 400 },
    );
  }

  // Rate limit: máx 3 códigos por usuario / 10 min, + límite por IP.
  const rl = checkRateLimit(`admin-otp:${user.id}`, { limit: 3, windowSeconds: 600 });
  if (!rl.success) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos. Espera unos minutos antes de pedir otro código." },
      { status: 429 },
    );
  }
  const ipRl = checkRateLimit(`admin-otp-ip:${getClientIP(req)}`, { limit: 10, windowSeconds: 600 });
  if (!ipRl.success) {
    return NextResponse.json({ ok: false, error: "Demasiados intentos." }, { status: 429 });
  }

  const code = generateAdminOtp();
  const expiresAt = new Date(Date.now() + ADMIN_OTP_TTL_MS);

  // Invalida códigos previos no usados.
  await prisma.adminOtpToken.deleteMany({ where: { userId: user.id, usedAt: null } });
  await prisma.adminOtpToken.create({
    data: { userId: user.id, code, expiresAt },
  });

  const locale =
    (user as { preferredLang?: string; language?: string }).preferredLang ||
    (user as { language?: string }).language ||
    "es";

  const sent = await sendAdminOtpEmail({
    to: user.email,
    name: user.name,
    code,
    locale,
  });

  if (!sent.ok) {
    return NextResponse.json(
      { ok: false, error: "No se pudo enviar el código por email. Intenta de nuevo." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, expiresAt });
}
