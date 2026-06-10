/**
 * 📧 GET /api/integrations/gmail/install — inicia OAuth Google.
 * Espejo de slack/install: requiere sesión, state anti-CSRF en cookie httpOnly.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getServerAuthUser } from "@/core/auth";
import { getGmailConfig, getGmailRedirectUri, GMAIL_SCOPES } from "@/lib/gmail/config";
import { secureLog } from "@/lib/logging";

export const runtime = "nodejs";

const STATE_COOKIE = "gmail_oauth_state";

export async function GET(req: NextRequest) {
  const user = await getServerAuthUser();
  if (!user) {
    const signin = new URL("/signin", req.url);
    signin.searchParams.set("callbackUrl", "/api/integrations/gmail/install");
    return NextResponse.redirect(signin);
  }

  const { clientId } = await getGmailConfig();
  if (!clientId) {
    secureLog.error("gmail.install.missing_client_id");
    const dest = new URL("/hub/admin/integrations", req.url);
    dest.searchParams.set("gmail", "misconfigured");
    return NextResponse.redirect(dest);
  }

  const state = crypto.randomBytes(32).toString("hex");
  const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", getGmailRedirectUri());
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", GMAIL_SCOPES);
  authorizeUrl.searchParams.set("access_type", "offline"); // para obtener refresh_token
  authorizeUrl.searchParams.set("prompt", "consent");
  authorizeUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authorizeUrl.toString());
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
