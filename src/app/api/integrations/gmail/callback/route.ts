/**
 * 📧 GET /api/integrations/gmail/callback — completa OAuth Google.
 * Valida el state, intercambia code por tokens, guarda la conexión
 * (IntegrationConnection platform=EMAIL, por usuario) y vuelve al panel.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";
import { getGmailConfig, getGmailRedirectUri } from "@/lib/gmail/config";
import { secureLog } from "@/lib/logging";

export const runtime = "nodejs";

const STATE_COOKIE = "gmail_oauth_state";

function backToPanel(req: NextRequest, status: string) {
  const dest = new URL("/hub/admin/integrations", req.url);
  dest.searchParams.set("gmail", status);
  return NextResponse.redirect(dest);
}

export async function GET(req: NextRequest) {
  const user = await getServerAuthUser();
  if (!user) return backToPanel(req, "denied");

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.cookies.get(STATE_COOKIE)?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    secureLog.warn("gmail.callback.bad_state", { userId: user.id });
    return backToPanel(req, "error");
  }

  const { clientId, clientSecret } = await getGmailConfig();
  if (!clientId || !clientSecret) return backToPanel(req, "misconfigured");

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: getGmailRedirectUri(),
      }),
    });
    if (!tokenRes.ok) {
      secureLog.warn("gmail.callback.token_error", { status: tokenRes.status });
      return backToPanel(req, "error");
    }
    const tok = await tokenRes.json();

    // Email de la cuenta conectada (para mostrar y como From).
    let email: string | null = null;
    try {
      const me = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tok.access_token}` },
      }).then((r) => r.json());
      email = me?.email ?? null;
    } catch {
      /* opcional */
    }

    const tenantId = user.primaryTenantId ?? "personal";
    const existing = await prisma.integrationConnection.findFirst({
      where: { userId: user.id, platform: "EMAIL" },
      select: { id: true },
    });
    const data = {
      tenantId,
      userId: user.id,
      platform: "EMAIL" as const,
      name: email || "Gmail",
      status: "connected",
      accessToken: tok.access_token ?? null,
      refreshToken: tok.refresh_token ?? null,
      tokenExpiry: tok.expires_in
        ? new Date(Date.now() + Number(tok.expires_in) * 1000)
        : null,
      scope: tok.scope ?? null,
    };
    if (existing) {
      await prisma.integrationConnection.update({ where: { id: existing.id }, data });
    } else {
      await prisma.integrationConnection.create({ data });
    }

    const res = backToPanel(req, "connected");
    res.cookies.delete(STATE_COOKIE);
    return res;
  } catch (err) {
    secureLog.error("gmail.callback.failed", err);
    return backToPanel(req, "error");
  }
}
