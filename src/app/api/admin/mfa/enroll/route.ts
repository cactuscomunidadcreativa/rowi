// src/app/api/admin/mfa/enroll/route.ts
// ============================================================
// 🔐 Enroll TOTP: genera (si hace falta) el secreto del admin y
// devuelve el QR para escanear con la app autenticadora.
// GET  → estado: { enrolled: boolean }
// POST → genera secreto pendiente + QR (si aún no hay uno confirmado)
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { adminMfaBypassEnabled } from "@/lib/admin-mfa/edge";
import {
  generateTotpSecret,
  encryptTotpSecret,
  buildQrDataUrl,
} from "@/lib/admin-mfa/totp";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { mfaEnabledAt: true },
  });
  return NextResponse.json({
    ok: true,
    enrolled: !!user?.mfaEnabledAt,
    bypass: adminMfaBypassEnabled(),
  });
}

export async function POST() {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;
  const userId = auth.user.id;
  const email = auth.user.email || "admin";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabledAt: true, mfaTotpSecret: true },
  });

  // Si ya completó el enroll, no regeneramos el secreto (evita romper su
  // app por accidente). Para re-enrolar hay que limpiar mfaTotpSecret/
  // mfaEnabledAt primero (con el bypass activo como escape).
  if (user?.mfaEnabledAt) {
    return NextResponse.json(
      { ok: false, error: "MFA ya está configurado para esta cuenta." },
      { status: 409 },
    );
  }

  // Genera un secreto nuevo y lo guarda cifrado, SIN confirmar todavía
  // (mfaEnabledAt sigue null hasta que verifique el primer código).
  const { base32, otpauthUrl } = generateTotpSecret(email);
  await prisma.user.update({
    where: { id: userId },
    data: { mfaTotpSecret: encryptTotpSecret(base32) },
  });

  const qrDataUrl = await buildQrDataUrl(otpauthUrl);
  return NextResponse.json({ ok: true, qrDataUrl, otpauthUrl });
}
