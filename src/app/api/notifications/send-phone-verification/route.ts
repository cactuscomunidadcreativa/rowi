// src/app/api/notifications/send-phone-verification/route.ts
// ============================================================
// Envía un código OTP por WhatsApp para verificar el número del usuario.
// Mismo patrón que el flujo de verificación de email, pero el canal es
// WhatsApp (Twilio) y el token es un código de 6 dígitos con TTL corto.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";
import { postWhatsAppMessage } from "@/lib/whatsapp/postMessage";
import { checkRateLimitDistributed, getClientIP } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutos

/** Normaliza a E.164 (best-effort): deja dígitos y antepone `+`. */
function toE164(raw: string): string | null {
  const cleaned = raw.trim();
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null; // rango E.164 razonable
  return `+${digits}`;
}

/** Genera un código numérico de 6 dígitos criptográficamente aleatorio. */
function generateCode(): string {
  // 0..999999, padded. randomInt es uniforme y sin sesgo de módulo.
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * POST /api/notifications/send-phone-verification
 * Body: { phone: string }  // número a verificar
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: máx 3 envíos por usuario cada 10 min (anti-abuso + costo).
    const rl = await checkRateLimitDistributed(`phone-verify:${auth.id}`, { limit: 3, windowSeconds: 600 });
    if (!rl.success) {
      return NextResponse.json(
        { ok: false, error: "Demasiados intentos. Espera unos minutos antes de pedir otro código." },
        { status: 429 },
      );
    }
    // Segundo limitador por IP para mitigar enumeración.
    const ipRl = await checkRateLimitDistributed(`phone-verify-ip:${getClientIP(req)}`, { limit: 10, windowSeconds: 600 });
    if (!ipRl.success) {
      return NextResponse.json({ ok: false, error: "Demasiados intentos." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const phone = toE164(String(body.phone || ""));
    if (!phone) {
      return NextResponse.json(
        { ok: false, error: "Número inválido. Usa formato internacional, p.ej. +5215512345678." },
        { status: 400 },
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    // Invalida códigos previos no usados de este usuario para este número.
    await prisma.phoneVerificationToken.deleteMany({
      where: { userId: auth.id, phone, usedAt: null },
    });
    await prisma.phoneVerificationToken.create({
      data: { userId: auth.id, phone, code, channel: "whatsapp", expiresAt },
    });

    const sent = await postWhatsAppMessage({
      to: phone,
      text: `Tu código de verificación de Rowi es: ${code}\n\nVence en 10 minutos. Si no lo solicitaste, ignora este mensaje.`,
    });

    if (!sent.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se pudo enviar el código por WhatsApp. Verifica que el número sea correcto y que tengas una conversación abierta con el número de Rowi.",
          detail: sent.error,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, expiresAt });
  } catch (error) {
    console.error("[send-phone-verification]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
