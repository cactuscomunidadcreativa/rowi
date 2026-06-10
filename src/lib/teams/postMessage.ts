/**
 * 💬 Microsoft Teams — postMessage (Incoming Webhook).
 *
 * Postea un MessageCard al webhook del canal del tenant. Espejo de
 * lib/slack/postMessage.ts pero por webhook (no Web API + token).
 */
import { getTeamsConnection } from "./config";
import { secureLog } from "@/lib/logging";

export async function postTeamsMessage(opts: {
  tenantId: string;
  text: string;
  title?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const conn = await getTeamsConnection(opts.tenantId);
  if (!conn) {
    secureLog.warn("teams.post.not_connected", { tenantId: opts.tenantId });
    return { ok: false, error: "not_connected" };
  }

  // MessageCard: el formato que aceptan los Incoming Webhooks de Teams.
  const card = {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    themeColor: "7c3aed", // violeta Rowi
    summary: opts.title || "Rowi",
    sections: [
      {
        activityTitle: opts.title || "Rowi",
        text: opts.text.slice(0, 4000),
      },
    ],
  };

  try {
    const res = await fetch(conn.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
    });
    if (!res.ok) {
      secureLog.warn("teams.post.webhook_error", { status: res.status });
      return { ok: false, error: `teams_${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    secureLog.error("teams.post.failed", err);
    return { ok: false, error: "request_failed" };
  }
}
