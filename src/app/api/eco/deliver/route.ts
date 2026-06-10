/**
 * 📤 /api/eco/deliver — envío DIRECTO del mensaje compuesto por ECO.
 *
 * Cierra el círculo componer→enviar: cuando el usuario tiene una integración
 * conectada, el mensaje sale desde Rowi sin deep-links.
 *
 *  - GET  → qué canales directos tiene disponibles el usuario actual
 *           { gmail: { connected, email }, whatsapp: { connected } }
 *  - POST → { channel: "gmail" | "whatsapp", to, subject?, text, dyadId? }
 *           envía vía sendGmail / postWhatsAppMessage y registra el outcome
 *           (mismo loop que /api/eco/send).
 *
 * Gmail sale de la cuenta OAuth del propio usuario (IntegrationConnection
 * platform=EMAIL). WhatsApp sale del número Twilio de la plataforma, por eso
 * el rate-limit es más estricto ahí.
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { sendGmail } from "@/lib/gmail/send";
import { postWhatsAppMessage } from "@/lib/whatsapp/postMessage";
import { getWhatsAppConfig } from "@/lib/whatsapp/config";
import { recordEcoSent } from "@/domains/eco/lib/ecoBridge";
import { trackFunnel } from "@/domains/metrics/lib/funnel";
import { rateLimit } from "@/lib/security/rateLimit";
import { secureLog } from "@/lib/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireUser(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = token?.email?.toLowerCase();
  if (!email) return null;
  return prisma.user.findUnique({ where: { email }, select: { id: true } });
}

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const [gmailConn, waCfg] = await Promise.all([
    prisma.integrationConnection.findFirst({
      where: { userId: user.id, platform: "EMAIL", status: "connected" },
      select: { name: true },
    }),
    getWhatsAppConfig(),
  ]);

  return NextResponse.json({
    ok: true,
    gmail: { connected: !!gmailConn, email: gmailConn?.name ?? null },
    whatsapp: {
      connected: !!(waCfg.accountSid && waCfg.authToken && waCfg.whatsappNumber),
    },
  });
}

type Body = {
  channel?: "gmail" | "whatsapp";
  to?: string;
  subject?: string;
  text?: string;
  dyadId?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const channel = body.channel;
    const to = (body.to || "").trim();
    const text = (body.text || "").trim();

    if (channel !== "gmail" && channel !== "whatsapp") {
      return NextResponse.json({ ok: false, error: "invalid_channel" }, { status: 400 });
    }
    if (!text) {
      return NextResponse.json({ ok: false, error: "text_required" }, { status: 400 });
    }
    if (channel === "gmail" && !EMAIL_RE.test(to)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }
    if (channel === "whatsapp" && !PHONE_RE.test(to)) {
      return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 400 });
    }

    // Anti-abuso: Gmail sale de la cuenta del usuario (20/h); WhatsApp gasta
    // el número Twilio de la plataforma (10/h por usuario).
    const rl = await rateLimit(`eco_deliver:${channel}:${user.id}`, {
      limit: channel === "whatsapp" ? 10 : 20,
      window: 3600,
      prefix: "eco_deliver",
    });
    if (!rl.success) {
      return NextResponse.json(
        { ok: false, error: "rate_limited" },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        },
      );
    }

    let result: { ok: boolean; error?: string };
    if (channel === "gmail") {
      result = await sendGmail({
        userId: user.id,
        to,
        subject: (body.subject || "").slice(0, 200),
        body: text,
      });
    } else {
      const subj = (body.subject || "").trim();
      result = await postWhatsAppMessage({
        to,
        text: subj ? `${subj}\n\n${text}` : text,
      });
    }

    if (!result.ok) {
      // not_connected / refresh_failed / gmail_4xx / Twilio — códigos internos
      // sin PII, seguros de devolver para que la UI explique qué pasó.
      return NextResponse.json(
        { ok: false, error: result.error || "send_failed" },
        { status: 502 },
      );
    }

    // Mismo loop de outcome que /api/eco/send: si hay díada propia, registrar.
    if (body.dyadId) {
      const dyad = await prisma.relationshipDyad.findFirst({
        where: { id: body.dyadId, ownerUserId: user.id },
        select: { id: true },
      });
      if (dyad) {
        await recordEcoSent({
          dyadId: dyad.id,
          ownerUserId: user.id,
          channel: `direct_${channel}`,
          text,
        });
      }
    }
    await trackFunnel("eco_sent", {
      details: { channel: `direct_${channel}`, dyadId: body.dyadId ?? null },
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    secureLog.error("eco.deliver.failed", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
