/**
 * =========================================================
 * 💬 Slack — postSlackMessage
 * =========================================================
 * Postea un mensaje al Web API de Slack (chat.postMessage) usando el
 * bot token (`xoxb-...`) desencriptado del team, vía
 * `getBotTokenForTeam(teamId)`.
 *
 * Slack responde 200 incluso en errores lógicos; el éxito real está en
 * el campo JSON `ok`. Aquí lo inspeccionamos y logueamos `ok:false` con
 * secureLog (p.ej. not_in_channel, channel_not_found, invalid_auth).
 * =========================================================
 */

import { getBotTokenForTeam } from "@/lib/slack/config";
import { secureLog } from "@/lib/logging";

const SLACK_POST_MESSAGE_URL = "https://slack.com/api/chat.postMessage";

export type PostSlackMessageArgs = {
  teamId: string;
  channel: string;
  text: string;
  /** Si se pasa, el mensaje se postea como respuesta en el hilo. */
  threadTs?: string;
};

export type PostSlackMessageResult = {
  ok: boolean;
  /** Código de error de Slack cuando ok=false (p.ej. "not_in_channel"). */
  error?: string;
  /** ts del mensaje creado cuando ok=true. */
  ts?: string;
};

export async function postSlackMessage(
  args: PostSlackMessageArgs
): Promise<PostSlackMessageResult> {
  const { teamId, channel, text, threadTs } = args;

  if (!teamId || !channel || !text) {
    secureLog.warn("slack.post.missing_args", {
      teamId: teamId || undefined,
      hasChannel: !!channel,
      hasText: !!text,
    });
    return { ok: false, error: "missing_args" };
  }

  const token = await getBotTokenForTeam(teamId);
  if (!token) {
    secureLog.warn("slack.post.no_bot_token", { teamId });
    return { ok: false, error: "no_bot_token" };
  }

  try {
    const res = await fetch(SLACK_POST_MESSAGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        channel,
        text,
        ...(threadTs ? { thread_ts: threadTs } : {}),
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      ts?: string;
    };

    if (!data.ok) {
      secureLog.warn("slack.post.api_error", {
        teamId,
        channel,
        error: data.error || "unknown",
      });
      return { ok: false, error: data.error || "unknown" };
    }

    return { ok: true, ts: data.ts };
  } catch (err) {
    secureLog.error("slack.post.request_failed", err, { teamId, channel });
    return { ok: false, error: "request_failed" };
  }
}
