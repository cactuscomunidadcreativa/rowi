/**
 * =========================================================
 * 💬 Slack Events API (F2c)
 * =========================================================
 * POST /api/integrations/slack/events
 *
 * Recibe eventos de Slack (app_mention, message.im, etc.) y el
 * handshake inicial url_verification.
 *
 * Reglas críticas:
 *   - Leer rawBody con req.text() ANTES de parsear (necesario para
 *     verificar la firma HMAC).
 *   - Responder en <3s SIEMPRE, o Slack reintenta y eventualmente
 *     deshabilita el endpoint.
 *   - El handshake url_verification debe responder { challenge }.
 *     Verificamos firma igual cuando hay signing secret configurado.
 *
 * Es pública en el middleware: Slack la llama sin sesión NextAuth.
 * Se autentica por firma (x-slack-signature).
 *
 * El wiring real al Rowi Coach AI es F3 — aquí solo stub + log.
 * =========================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { getSlackConfig, verifySlackSignature } from "@/lib/slack/config";
import { secureLog } from "@/lib/logging";

export const runtime = "nodejs";

// Idempotencia simple en memoria: Slack reintenta eventos y puede
// reenviar el mismo event_id. Esto es best-effort por instancia
// serverless (no persiste entre cold starts). TODO F3: persistir o
// usar un store compartido si el dedupe se vuelve crítico.
const SEEN_TTL_MS = 5 * 60 * 1000;
const MAX_SEEN = 1000;
const seenEvents = new Map<string, number>();

function alreadyProcessed(eventId: string): boolean {
  const now = Date.now();
  // GC perezoso de entradas viejas.
  if (seenEvents.size > MAX_SEEN) {
    for (const [id, ts] of seenEvents) {
      if (now - ts > SEEN_TTL_MS) seenEvents.delete(id);
    }
  }
  const prev = seenEvents.get(eventId);
  if (prev && now - prev < SEEN_TTL_MS) return true;
  seenEvents.set(eventId, now);
  return false;
}

export async function POST(req: NextRequest) {
  // 1) rawBody primero — necesario para verificar firma.
  const rawBody = await req.text();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { signingSecret } = await getSlackConfig();
  const signature = req.headers.get("x-slack-signature") || "";
  const timestamp = req.headers.get("x-slack-request-timestamp") || "";

  // 2) Verificación de firma. Cuando hay signing secret configurado,
  // se exige firma válida incluso para el handshake.
  if (signingSecret) {
    const valid = verifySlackSignature(rawBody, timestamp, signature, signingSecret);
    if (!valid) {
      secureLog.warn("slack.events.invalid_signature");
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }
  }

  // 3) Handshake url_verification — responder el challenge.
  if (parsed.type === "url_verification") {
    return NextResponse.json({ challenge: parsed.challenge });
  }

  // 4) event_callback — idempotencia + stub.
  if (parsed.type === "event_callback") {
    const eventId = typeof parsed.event_id === "string" ? parsed.event_id : "";
    if (eventId && alreadyProcessed(eventId)) {
      // Ya visto — responder 200 sin reprocesar.
      return NextResponse.json({ ok: true, dedup: true });
    }

    const event = (parsed.event as Record<string, unknown> | undefined) ?? {};
    const eventType = typeof event.type === "string" ? event.type : "";
    const teamId = typeof parsed.team_id === "string" ? parsed.team_id : "";

    // Ignorar mensajes del propio bot (evita loops). bot_id presente =>
    // lo emitió un bot/integración.
    const isBotMessage = "bot_id" in event && !!event.bot_id;

    if (!isBotMessage && (eventType === "app_mention" || eventType === "message")) {
      // STUB F2c: solo loggear. El wiring al Rowi Coach AI es F3.
      secureLog.info("slack.events.received", {
        eventType,
        teamId,
        channel: typeof event.channel === "string" ? event.channel : undefined,
        slackUserId: typeof event.user === "string" ? event.user : undefined,
      });
    }

    // Responder 200 rápido siempre — el procesamiento real (si lo hay)
    // debe ser async/diferido en F3.
    return NextResponse.json({ ok: true });
  }

  // Cualquier otro tipo: ack 200.
  return NextResponse.json({ ok: true });
}
