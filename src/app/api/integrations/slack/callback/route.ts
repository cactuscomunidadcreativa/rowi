/**
 * =========================================================
 * 💬 Slack OAuth — Callback (F2b)
 * =========================================================
 * GET /api/integrations/slack/callback?code=...&state=...
 *
 * Slack redirige aquí tras el consentimiento del usuario. El flujo:
 *   1. Valida `state` contra la cookie httpOnly (anti-CSRF).
 *   2. Intercambia `code` por un bot token vía oauth.v2.access.
 *   3. Upsert de SlackInstallation por teamId (token encriptado).
 *   4. Vincula la identidad Slack del instalador con su user de Rowi
 *      (SlackUserLink).
 *   5. Redirige a /hub/admin/integrations?slack=connected.
 *
 * Es pública en el middleware: Slack la llama sin sesión NextAuth,
 * pero se protege con el `state` (que sí requirió sesión al generarse).
 * Aun así re-validamos la sesión para atar installedByUserId.
 * =========================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/core/auth/requireAdmin";
import { getSlackConfig, getSlackRedirectUri } from "@/lib/slack/config";
import { encryptValue } from "@/lib/config/systemConfig";
import { prisma } from "@/core/prisma";
import { secureLog } from "@/lib/logging";

export const runtime = "nodejs";

const STATE_COOKIE = "slack_oauth_state";

type SlackOAuthResponse = {
  ok: boolean;
  error?: string;
  access_token?: string; // bot token xoxb-...
  scope?: string;
  bot_user_id?: string;
  team?: { id?: string; name?: string };
  authed_user?: { id?: string };
};

function redirectToIntegrations(req: NextRequest, status: string): NextResponse {
  const dest = new URL("/hub/admin/integrations", req.url);
  dest.searchParams.set("slack", status);
  const res = NextResponse.redirect(dest);
  // Limpiar la cookie de state en cualquier salida.
  res.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  // Usuario canceló el consentimiento en Slack.
  if (oauthError) {
    secureLog.warn("slack.callback.user_denied", { reason: oauthError });
    return redirectToIntegrations(req, "denied");
  }

  // 1) Validar state contra la cookie (CSRF). Diagnóstico granular para
  // distinguir el caso (config de Slack vs cookie perdida).
  const cookieState = req.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !cookieState || state !== cookieState) {
    const detail = !code
      ? "missing_code" // Slack no devolvió code → revisar Redirect URL / config de la app
      : !state
        ? "missing_state_param"
        : !cookieState
          ? "missing_state_cookie" // cookie no llegó → empezaste el flujo en /install? www vs no-www?
          : "state_mismatch"; // cookie no coincide → reintento viejo o doble flujo
    secureLog.warn("slack.callback.invalid", { detail });
    return new NextResponse(
      JSON.stringify({
        ok: false,
        error: "Invalid state or code",
        detail,
        hint:
          detail === "missing_code"
            ? "Slack no envió un código. Verifica que la Redirect URL en la Slack App sea exactamente https://www.rowiia.com/api/integrations/slack/callback y que las claves estén configuradas."
            : detail === "missing_state_cookie"
              ? "La cookie de seguridad no llegó. Empieza el flujo abriendo /api/integrations/slack/install (no el callback directo), en el mismo navegador, con www."
              : "El state no coincide. Probablemente reabriste un enlace viejo. Reinicia desde /api/integrations/slack/install.",
      }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  // Re-validar sesión para atar installedByUserId al instalador.
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    const signin = new URL("/signin", req.url);
    signin.searchParams.set("callbackUrl", "/hub/admin/integrations");
    return NextResponse.redirect(signin);
  }
  const user = auth.user;

  // 2) Intercambiar code por token.
  const { clientId, clientSecret } = await getSlackConfig();
  if (!clientId || !clientSecret) {
    secureLog.error("slack.callback.missing_credentials");
    return redirectToIntegrations(req, "misconfigured");
  }

  // Mismo redirect_uri canónico que usó /install (getSlackRedirectUri) —
  // Slack exige que coincida exactamente en el intercambio del code.
  const redirectUri = getSlackRedirectUri();

  let data: SlackOAuthResponse;
  try {
    const resp = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });
    data = (await resp.json()) as SlackOAuthResponse;
  } catch (err) {
    secureLog.error("slack.callback.exchange_failed", err);
    return redirectToIntegrations(req, "error");
  }

  if (!data.ok || !data.access_token || !data.team?.id) {
    secureLog.error("slack.callback.exchange_rejected", undefined, {
      slackError: data.error || "unknown",
    });
    return redirectToIntegrations(req, "error");
  }

  const teamId = data.team.id;
  const teamName = data.team.name ?? null;
  const botUserId = data.bot_user_id ?? null;
  const scopes = data.scope ?? null;
  const authedUserId = data.authed_user?.id ?? null;
  const botTokenEnc = encryptValue(data.access_token);

  // 3) Upsert SlackInstallation por teamId. tenantId queda null por
  // ahora; el wizard B2B lo atará después.
  try {
    await prisma.slackInstallation.upsert({
      where: { teamId },
      update: {
        teamName,
        botTokenEnc,
        botUserId,
        scopes,
        installedByUserId: user.id,
      },
      create: {
        teamId,
        teamName,
        botTokenEnc,
        botUserId,
        scopes,
        installedByUserId: user.id,
      },
    });
  } catch (err) {
    secureLog.error("slack.callback.install_persist_failed", err, { teamId });
    return redirectToIntegrations(req, "error");
  }

  // 4) Vincular identidad Slack del instalador ↔ user de Rowi.
  if (authedUserId) {
    try {
      await prisma.slackUserLink.upsert({
        where: {
          slackTeamId_slackUserId: {
            slackTeamId: teamId,
            slackUserId: authedUserId,
          },
        },
        update: { userId: user.id },
        create: {
          slackTeamId: teamId,
          slackUserId: authedUserId,
          userId: user.id,
        },
      });
    } catch (err) {
      // El link no es bloqueante para la instalación.
      secureLog.error("slack.callback.user_link_failed", err, { teamId });
    }
  }

  secureLog.info("slack.callback.connected", { teamId, userId: user.id });
  return redirectToIntegrations(req, "connected");
}
