/**
 * =========================================================
 * 💬 WhatsApp Inbound Webhook (Twilio)
 * =========================================================
 * POST /api/integrations/whatsapp/webhook
 *
 * Espejo de /api/integrations/slack/events para el canal WhatsApp:
 *   - Lee el body form-urlencoded de Twilio (From, Body, MessageSid…).
 *   - Verifica la firma X-Twilio-Signature (HMAC-SHA1 sobre URL+params)
 *     cuando hay Auth Token configurado.
 *   - Resuelve identidad (número → User) y delega al Coach compartido.
 *   - Responde 200 de inmediato; el trabajo pesado (IA + envío de la
 *     respuesta) corre vía after() para no exceder el timeout de Twilio.
 *
 * Pública en el middleware: Twilio la llama sin sesión NextAuth; se
 * autentica por firma.
 * =========================================================
 */

import { NextRequest, NextResponse, after } from "next/server";
import {
  getWhatsAppConfig,
  getWhatsAppWebhookUrl,
  verifyTwilioSignature,
} from "@/lib/whatsapp/config";
import { handleWhatsAppMessage } from "@/lib/whatsapp/coach";
import { postWhatsAppMessage } from "@/lib/whatsapp/postMessage";
import { secureLog } from "@/lib/logging";

export const runtime = "nodejs";

// Idempotencia best-effort por instancia: Twilio puede reintentar el mismo
// MessageSid. Mismo patrón (y misma limitación) que el dedupe de Slack.
const SEEN_TTL_MS = 5 * 60 * 1000;
const MAX_SEEN = 1000;
const seen = new Map<string, number>();

function alreadyProcessed(sid: string): boolean {
  const now = Date.now();
  if (seen.size > MAX_SEEN) {
    for (const [id, ts] of seen) if (now - ts > SEEN_TTL_MS) seen.delete(id);
  }
  const prev = seen.get(sid);
  if (prev && now - prev < SEEN_TTL_MS) return true;
  seen.set(sid, now);
  return false;
}

async function processInbound(from: string, body: string): Promise<void> {
  try {
    const result = await handleWhatsAppMessage(from, body);
    await postWhatsAppMessage({ to: from, text: result.text });
  } catch (err) {
    secureLog.error("whatsapp.webhook.process_failed", err);
  }
}

export async function POST(req: NextRequest) {
  // 1) rawBody primero — necesario para verificar la firma.
  const rawBody = await req.text();
  const params: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(rawBody)) params[k] = v;

  // 2) Verificación de firma Twilio (si hay Auth Token configurado).
  const { authToken } = await getWhatsAppConfig();
  const signature = req.headers.get("x-twilio-signature") || "";
  if (authToken) {
    const valid = verifyTwilioSignature(getWhatsAppWebhookUrl(), params, signature, authToken);
    if (!valid) {
      secureLog.warn("whatsapp.webhook.invalid_signature");
      return new NextResponse("invalid signature", { status: 401 });
    }
  }

  const from = params.From || "";
  const body = (params.Body || "").trim();
  const messageSid = params.MessageSid || params.SmsMessageSid || "";

  // 3) Dedupe + validación mínima. Siempre ack 200 (TwiML vacío) para que
  // Twilio no reintente; la respuesta real se envía vía API en after().
  const emptyTwiml = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
  const ackHeaders = { "Content-Type": "text/xml" };

  if (!from || !body) {
    return new NextResponse(emptyTwiml, { status: 200, headers: ackHeaders });
  }
  if (messageSid && alreadyProcessed(messageSid)) {
    return new NextResponse(emptyTwiml, { status: 200, headers: ackHeaders });
  }

  // 4) Trabajo pesado fuera del ciclo de respuesta (misma estrategia que
  // Slack: ack inmediato, IA + envío en after()).
  after(processInbound(from, body));

  return new NextResponse(emptyTwiml, { status: 200, headers: ackHeaders });
}
