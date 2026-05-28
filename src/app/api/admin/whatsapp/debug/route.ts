/**
 * 🔧 GET /api/admin/whatsapp/debug
 * ============================================================
 * Diagnóstico de la integración WhatsApp (Twilio). Espejo de
 * /api/admin/slack/debug. SuperAdmin / admin.
 *
 * Sin params: reporta si las credenciales Twilio están presentes (desde
 * SystemConfig → env), si la cuenta es válida contra la API de Twilio, y si
 * TU usuario tiene un número de WhatsApp verificado (lo que el webhook usa
 * para resolver identidad).
 *
 * Con ?test=1: envía un WhatsApp de prueba a TU número verificado —
 * SINCRÓNICO, sin pasar por el webhook ni after(). Si llega, el envío
 * funciona y un fallo de conversación estaría en la recepción (sandbox sin
 * join / sesión 24h vencida / webhook mal configurado en Twilio).
 * ============================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/core/auth/requireAdmin";
import { prisma } from "@/core/prisma";
import { getWhatsAppConfig, getWhatsAppWebhookUrl } from "@/lib/whatsapp/config";
import { postWhatsAppMessage } from "@/lib/whatsapp/postMessage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Valida que la cuenta Twilio responde (credenciales correctas). */
async function checkTwilioAccount(accountSid: string, authToken: string): Promise<boolean> {
  if (!accountSid || !authToken) return false;
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const res = await fetch(url, { headers: { Authorization: `Basic ${authHeader}` } });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user;

  const { accountSid, authToken, whatsappNumber } = await getWhatsAppConfig();
  const credsPresent = !!(accountSid && authToken && whatsappNumber);

  if (!credsPresent) {
    return NextResponse.json({
      ok: false,
      step: "credentials",
      message:
        "Faltan credenciales Twilio. Configura TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_NUMBER en /hub/admin/settings (o env).",
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasWhatsappNumber: !!whatsappNumber,
    });
  }

  const accountValid = await checkTwilioAccount(accountSid, authToken);

  // ¿Tu usuario tiene un número verificado? (lo que el webhook usa).
  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: user.id },
    select: { whatsappNumber: true, whatsappVerified: true },
  });

  const base = {
    ok: true,
    credsPresent,
    accountValid,
    whatsappFrom: whatsappNumber,
    webhookUrl: getWhatsAppWebhookUrl(),
    youAreVerified: !!prefs?.whatsappVerified,
    yourNumberOnFile: prefs?.whatsappNumber ? maskPhone(prefs.whatsappNumber) : null,
  };

  const wantsTest = new URL(req.url).searchParams.get("test") === "1";
  if (!wantsTest) {
    return NextResponse.json({
      ...base,
      hint: "Agrega ?test=1 para que Rowi te envíe un WhatsApp de prueba a tu número verificado.",
    });
  }

  if (!accountValid) {
    return NextResponse.json({
      ...base,
      testResult: { ok: false, error: "twilio_account_invalid (revisa SID/token)" },
    });
  }
  if (!prefs?.whatsappVerified || !prefs.whatsappNumber) {
    return NextResponse.json({
      ...base,
      testResult: {
        ok: false,
        error: "no_verified_number (verifica tu número en tus preferencias de notificación)",
      },
    });
  }

  const result = await postWhatsAppMessage({
    to: prefs.whatsappNumber,
    text: "🔧 Test de Rowi: si ves este mensaje, el envío por WhatsApp funciona. Si el Coach no responde a tus mensajes, revisa el webhook entrante en la consola de Twilio.",
  });

  return NextResponse.json({ ...base, testResult: result });
}

function maskPhone(phone: string): string {
  if (phone.length < 6) return "****";
  return phone.slice(0, 3) + "****" + phone.slice(-2);
}
