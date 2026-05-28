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
 * F3: el wiring al Rowi Coach AI está activo. app_mention y message.im
 * resuelven el user de Rowi (SlackUserLink), llaman al coach
 * (askRowiCoach) y postean la respuesta en hilo (postSlackMessage). El
 * trabajo pesado (IA + postMessage) corre fire-and-forget para devolver
 * 200 a Slack en <3s — ver nota en el handler.
 * =========================================================
 */

import { NextRequest, NextResponse, after } from "next/server";
import { getSlackConfig, verifySlackSignature } from "@/lib/slack/config";
import { getServerAppBaseUrl } from "@/core/utils/base-url";
import { prisma } from "@/core/prisma";
import { askRowiCoach } from "@/lib/slack/coach";
import { postSlackMessage } from "@/lib/slack/postMessage";
import { secureLog } from "@/lib/logging";

export const runtime = "nodejs";

/**
 * Quita la mención del bot (`<@U123>` o `<@U123|nombre>`) del texto, más
 * cualquier otra mención de usuario inicial, dejando el texto limpio
 * para el coach.
 */
function stripBotMention(text: string): string {
  return text.replace(/<@[A-Z0-9]+(?:\|[^>]+)?>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Procesa un evento de mensaje/mención de forma asíncrona: resuelve el
 * user de Rowi, consulta al coach y postea la respuesta en Slack.
 *
 * Se invoca fire-and-forget (sin await en el handler) para que la ruta
 * responda 200 a Slack en <3s. LIMITACIÓN: en Vercel serverless la
 * función puede terminar antes de que esto complete una vez devuelta la
 * respuesta HTTP; es best-effort. Para garantía dura habría que mover
 * esto a una cola (QStash / Inngest) o usar response_url diferido.
 */
async function processCoachEvent(opts: {
  teamId: string;
  channel: string;
  slackUserId: string;
  text: string;
  threadTs: string;
  baseUrl: string;
}): Promise<void> {
  const { teamId, channel, slackUserId, text, threadTs, baseUrl } = opts;

  try {
    // Resolver identidad: team_id + user_id → SlackUserLink → user Rowi.
    let link: { userId: string } | null = null;
    if (teamId && slackUserId) {
      link = await prisma.slackUserLink.findUnique({
        where: {
          slackTeamId_slackUserId: { slackTeamId: teamId, slackUserId },
        },
        select: { userId: true },
      });
    }

    if (!link) {
      await postSlackMessage({
        teamId,
        channel,
        threadTs,
        text: `Conecta tu cuenta de Rowi para conversar conmigo: ${baseUrl}/api/integrations/slack/install`,
      });
      return;
    }

    const cleaned = stripBotMention(text);
    const result = await askRowiCoach(link.userId, cleaned);

    await postSlackMessage({
      teamId,
      channel,
      threadTs,
      text: result.text,
    });
  } catch (err) {
    secureLog.error("slack.events.process_failed", err, { teamId, channel });
  }
}

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

    // Ignorar mensajes del propio bot (evita loops): bot_id presente, o
    // subtype bot_message. Sin esto, la respuesta del bot dispararía un
    // nuevo evento message → loop infinito.
    const subtype = typeof event.subtype === "string" ? event.subtype : "";
    const isBotMessage =
      ("bot_id" in event && !!event.bot_id) || subtype === "bot_message";

    // Para message.* solo atendemos DMs (channel_type === "im"). Mensajes
    // de canal sin mención los ignoramos (esos llegan como app_mention).
    const channelType =
      typeof event.channel_type === "string" ? event.channel_type : "";
    const isDirectMessage = eventType === "message" && channelType === "im";
    const isMention = eventType === "app_mention";

    const text = typeof event.text === "string" ? event.text : "";
    const channel = typeof event.channel === "string" ? event.channel : "";
    const slackUserId = typeof event.user === "string" ? event.user : "";
    // Responder en hilo: thread_ts si ya hay hilo, si no el ts del mensaje.
    const eventTs = typeof event.ts === "string" ? event.ts : "";
    const threadTs =
      (typeof event.thread_ts === "string" && event.thread_ts) || eventTs;

    if (
      !isBotMessage &&
      slackUserId &&
      channel &&
      text &&
      (isMention || isDirectMessage)
    ) {
      const baseUrl = getServerAppBaseUrl(req);

      // CRÍTICO <3s: NO esperamos a la IA ni al postMessage antes de
      // responder 200. `after()` (Next 16) agenda el trabajo pesado para
      // que corra DESPUÉS de enviar la respuesta HTTP y mantiene viva la
      // función serverless hasta que termine — así devolvemos el ack de
      // inmediato sin que Slack reintente (>3s genera duplicados).
      //
      // LIMITACIÓN: `after()` cubre el caso común en Vercel, pero sigue
      // habiendo límite de duración de la función; si la IA tardara más
      // que el timeout configurado, el postMessage no llegaría. Para
      // garantía dura ante respuestas muy lentas: mover a una cola
      // (QStash/Inngest) o usar el response_url diferido.
      after(
        processCoachEvent({
          teamId,
          channel,
          slackUserId,
          text,
          threadTs,
          baseUrl,
        })
      );
    }

    // Ack 200 inmediato siempre.
    return NextResponse.json({ ok: true });
  }

  // Cualquier otro tipo: ack 200.
  return NextResponse.json({ ok: true });
}
