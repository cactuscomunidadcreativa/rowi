/**
 * =========================================================
 * 💬 Slack Slash Command — /rowi (F2d)
 * =========================================================
 * POST /api/integrations/slack/commands
 *
 * Slack envía application/x-www-form-urlencoded. Leemos rawBody con
 * req.text() (necesario para verificar firma), parseamos con
 * URLSearchParams y respondemos con un mensaje efímero (bloques).
 *
 * Mapea team_id + user_id → SlackUserLink → user de Rowi. Si no hay
 * vínculo, pide conectar la cuenta primero.
 *
 * Es pública en el middleware: Slack la llama sin sesión NextAuth.
 * Se autentica por firma (x-slack-signature).
 *
 * El flujo real de check-in es follow-up (F3); aquí solo stub + log.
 * =========================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { getSlackConfig, verifySlackSignature } from "@/lib/slack/config";
import { getServerAppBaseUrl } from "@/core/utils/base-url";
import { prisma } from "@/core/prisma";
import { secureLog } from "@/lib/logging";

export const runtime = "nodejs";

type SlackBlock = Record<string, unknown>;

function ephemeral(blocks: SlackBlock[], fallbackText: string): NextResponse {
  return NextResponse.json({
    response_type: "ephemeral",
    text: fallbackText,
    blocks,
  });
}

function section(text: string): SlackBlock {
  return { type: "section", text: { type: "mrkdwn", text } };
}

export async function POST(req: NextRequest) {
  // 1) rawBody primero — necesario para verificar firma.
  const rawBody = await req.text();

  const { signingSecret } = await getSlackConfig();
  const signature = req.headers.get("x-slack-signature") || "";
  const timestamp = req.headers.get("x-slack-request-timestamp") || "";

  if (signingSecret) {
    const valid = verifySlackSignature(rawBody, timestamp, signature, signingSecret);
    if (!valid) {
      secureLog.warn("slack.commands.invalid_signature");
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }
  }

  // 2) Parsear el payload form-urlencoded.
  const params = new URLSearchParams(rawBody);
  const text = (params.get("text") || "").trim();
  const slackUserId = params.get("user_id") || "";
  const teamId = params.get("team_id") || "";
  // response_url disponible para respuestas diferidas en F3.
  // const responseUrl = params.get("response_url") || "";

  const baseUrl = getServerAppBaseUrl(req);

  // 3) Resolver identidad: team_id + user_id → SlackUserLink → user Rowi.
  let link: { userId: string } | null = null;
  if (teamId && slackUserId) {
    try {
      link = await prisma.slackUserLink.findUnique({
        where: {
          slackTeamId_slackUserId: { slackTeamId: teamId, slackUserId },
        },
        select: { userId: true },
      });
    } catch (err) {
      secureLog.error("slack.commands.link_lookup_failed", err, { teamId });
    }
  }

  if (!link) {
    return ephemeral(
      [
        section(
          `:link: *Conecta tu cuenta de Rowi primero.*\nInicia sesión y vincula Slack desde aquí: <${baseUrl}/signin|Conectar Rowi>`
        ),
      ],
      "Conecta tu cuenta de Rowi primero."
    );
  }

  // 4) Subcomandos. El primer token de `text` es el subcomando.
  const sub = text.split(/\s+/)[0]?.toLowerCase() || "help";

  if (sub === "checkin" || sub === "check-in") {
    // STUB F2d: el flujo real de check-in es follow-up (F3).
    secureLog.info("slack.commands.checkin", { teamId, userId: link.userId });
    return ephemeral(
      [
        section(
          ":white_check_mark: *Check-in registrado* (próximamente el flujo completo)."
        ),
      ],
      "Check-in registrado (próximamente el flujo completo)."
    );
  }

  // `/rowi help` (y fallback para cualquier otro texto).
  return ephemeral(
    [
      section(":wave: *Rowi en Slack* — comandos disponibles:"),
      section(
        "• `/rowi help` — muestra esta ayuda.\n" +
          "• `/rowi checkin` — registra un check-in emocional rápido."
      ),
    ],
    "Rowi en Slack — comandos disponibles."
  );
}
