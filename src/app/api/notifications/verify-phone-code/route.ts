// src/app/api/notifications/verify-phone-code/route.ts
// ============================================================
// Verifica el código OTP enviado por WhatsApp. Si es válido, marca el
// número como verificado en NotificationPreference (whatsappVerified=true)
// y activa el canal. El número verificado es lo que el webhook entrante usa
// para resolver la identidad del remitente (src/lib/whatsapp/coach.ts).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;

function toE164(raw: string): string | null {
  const digits = raw.trim().replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return `+${digits}`;
}

/**
 * POST /api/notifications/verify-phone-code
 * Body: { phone: string, code: string }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const phone = toE164(String(body.phone || ""));
    const code = String(body.code || "").trim();
    if (!phone || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { ok: false, error: "Número o código inválido." },
        { status: 400 },
      );
    }

    const token = await prisma.phoneVerificationToken.findFirst({
      where: { userId: auth.id, phone, usedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "No hay un código pendiente para este número. Solicita uno nuevo." },
        { status: 404 },
      );
    }

    if (token.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { ok: false, error: "El código venció. Solicita uno nuevo." },
        { status: 410 },
      );
    }

    if (token.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { ok: false, error: "Demasiados intentos fallidos. Solicita un código nuevo." },
        { status: 429 },
      );
    }

    if (token.code !== code) {
      await prisma.phoneVerificationToken.update({
        where: { id: token.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json(
        { ok: false, error: "Código incorrecto." },
        { status: 400 },
      );
    }

    // Código correcto → consumir token y marcar número verificado.
    await prisma.$transaction([
      prisma.phoneVerificationToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      prisma.notificationPreference.upsert({
        where: { userId: auth.id },
        update: { whatsappNumber: phone, whatsappVerified: true, whatsappEnabled: true },
        create: {
          userId: auth.id,
          whatsappNumber: phone,
          whatsappVerified: true,
          whatsappEnabled: true,
        },
      }),
    ]);

    return NextResponse.json({ ok: true, whatsappVerified: true });
  } catch (error) {
    console.error("[verify-phone-code]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
