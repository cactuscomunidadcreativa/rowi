/**
 * 📧 Gmail — enviar correo en nombre del usuario conectado.
 *
 * Usa el access_token guardado en IntegrationConnection (platform=EMAIL,
 * userId). Si está vencido, lo refresca con el refresh_token. El mensaje se
 * arma en RFC 2822 y se envía vía gmail.users.messages.send.
 */
import { prisma } from "@/core/prisma";
import { getGmailConfig } from "./config";
import { secureLog } from "@/lib/logging";

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const { clientId, clientSecret } = await getGmailConfig();
  if (!clientId || !clientSecret) return null;
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

/** Codifica un mensaje RFC2822 en base64url para la Gmail API. */
function buildRawMessage(to: string, subject: string, body: string, from?: string): string {
  const headers = [
    from ? `From: ${from}` : null,
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "MIME-Version: 1.0",
  ]
    .filter(Boolean)
    .join("\r\n");
  const raw = `${headers}\r\n\r\n${body}`;
  return Buffer.from(raw, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendGmail(opts: {
  userId: string;
  to: string;
  subject: string;
  body: string;
}): Promise<{ ok: boolean; error?: string }> {
  const conn = await prisma.integrationConnection.findFirst({
    where: { userId: opts.userId, platform: "EMAIL", status: "connected" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, accessToken: true, refreshToken: true, tokenExpiry: true, name: true },
  });
  if (!conn?.accessToken) return { ok: false, error: "not_connected" };

  // Refrescar si está vencido (o casi).
  let accessToken = conn.accessToken;
  const expired = conn.tokenExpiry ? conn.tokenExpiry.getTime() < Date.now() + 60_000 : false;
  if (expired && conn.refreshToken) {
    const fresh = await refreshAccessToken(conn.refreshToken);
    if (!fresh) return { ok: false, error: "refresh_failed" };
    accessToken = fresh;
    await prisma.integrationConnection.update({
      where: { id: conn.id },
      data: { accessToken: fresh, tokenExpiry: new Date(Date.now() + 3500 * 1000) },
    });
  }

  try {
    const raw = buildRawMessage(opts.to, opts.subject, opts.body, conn.name || undefined);
    const res = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
      },
    );
    if (!res.ok) {
      secureLog.warn("gmail.send.api_error", { status: res.status });
      return { ok: false, error: `gmail_${res.status}` };
    }
    await prisma.integrationConnection.update({
      where: { id: conn.id },
      data: { messagesSent: { increment: 1 }, lastSyncAt: new Date() },
    });
    return { ok: true };
  } catch (err) {
    secureLog.error("gmail.send.failed", err);
    return { ok: false, error: "request_failed" };
  }
}
