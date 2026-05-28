/**
 * =========================================================
 * 💬 Slack OAuth — Install (F2b)
 * =========================================================
 * GET /api/integrations/slack/install
 *
 * Inicia el flujo OAuth v2 de Slack. Requiere que el usuario esté
 * logueado en Rowi (la instalación se atribuye a su cuenta vía
 * installedByUserId). Genera un `state` aleatorio anti-CSRF que se
 * guarda en una cookie httpOnly corta (10 min) y se valida en el
 * callback.
 *
 * NO es pública en el middleware: requiere sesión NextAuth.
 * =========================================================
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/core/auth/requireAdmin";
import { getSlackConfig } from "@/lib/slack/config";
import { getServerAppBaseUrl } from "@/core/utils/base-url";
import { secureLog } from "@/lib/logging";

export const runtime = "nodejs";

// Scopes que la app solicita. chat:write / im:write para responder en DM,
// im:history + app_mentions:read para recibir eventos, commands para el
// slash command, users:read(.email) para matchear identidad.
const SLACK_SCOPES = [
  "chat:write",
  "im:write",
  "im:history",
  "app_mentions:read",
  "commands",
  "users:read",
  "users:read.email",
].join(",");

const STATE_COOKIE = "slack_oauth_state";

export async function GET(req: NextRequest) {
  // 1) Debe estar logueado. requireAuth devuelve { user, error }.
  const auth = await requireAuth();
  if (auth.error) {
    // Para una navegación de browser, redirigir a /signin con callback
    // en lugar de devolver 401 JSON.
    const signin = new URL("/signin", req.url);
    signin.searchParams.set("callbackUrl", "/api/integrations/slack/install");
    return NextResponse.redirect(signin);
  }

  // 2) Config Slack (SystemConfig → env). Sin clientId no hay flujo.
  const { clientId } = await getSlackConfig();
  if (!clientId) {
    secureLog.error("slack.install.missing_client_id");
    const dest = new URL("/hub/admin/integrations", req.url);
    dest.searchParams.set("slack", "misconfigured");
    return NextResponse.redirect(dest);
  }

  // 3) State anti-CSRF — cookie httpOnly 10 min.
  const state = crypto.randomBytes(32).toString("hex");

  // OAuth redirect_uri DEBE ser canónico y estable — Slack exige que
  // coincida exactamente con el configurado en la app, y que sea idéntico
  // entre /authorize y /oauth.v2.access. NO usamos el host de la request
  // (puede ser rowi.vercel.app o no-www); forzamos la URL canónica.
  const baseUrl = getServerAppBaseUrl(); // sin req → NEXT_PUBLIC_APP_URL o www.rowiia.com
  const redirectUri = `${baseUrl}/api/integrations/slack/callback`;

  const authorizeUrl = new URL("https://slack.com/oauth/v2/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("scope", SLACK_SCOPES);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authorizeUrl.toString());
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 min
  });

  return res;
}
