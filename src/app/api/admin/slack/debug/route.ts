/**
 * 🔧 GET /api/admin/slack/debug
 * ============================================================
 * Diagnóstico del bot de Slack. SuperAdmin / instalador.
 *
 * Sin params: reporta si hay SlackInstallation, si el bot token
 * desencripta, si tu usuario está vinculado (SlackUserLink), y los scopes.
 *
 * Con ?test=1: postea un mensaje de prueba a TU DM (usando tu slackUserId)
 * — SINCRÓNICO, sin pasar por el flujo de eventos ni after(). Si el
 * mensaje llega, postear funciona y el problema está en la recepción de
 * eventos (Messages Tab off / bot no en canal / after()). Si falla,
 * devuelve el error de Slack (invalid_auth, not_in_channel, etc.).
 * ============================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/core/auth/requireAdmin";
import { prisma } from "@/core/prisma";
import { getBotTokenForTeam } from "@/lib/slack/config";
import { postSlackMessage } from "@/lib/slack/postMessage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user;

  // Instalación del usuario (o la primera si es SuperAdmin).
  const install = await prisma.slackInstallation.findFirst({
    where: user.isSuperAdmin ? {} : { installedByUserId: user.id },
    orderBy: { createdAt: "desc" },
    select: { teamId: true, teamName: true, botUserId: true, scopes: true },
  });

  if (!install) {
    return NextResponse.json({
      ok: false,
      step: "installation",
      message: "No hay SlackInstallation. Conecta Slack primero (/api/integrations/slack/install).",
    });
  }

  // ¿El bot token desencripta?
  const token = await getBotTokenForTeam(install.teamId);
  const tokenOk = !!token;

  // ¿Tu usuario está vinculado?
  const link = await prisma.slackUserLink.findFirst({
    where: { slackTeamId: install.teamId, userId: user.id },
    select: { slackUserId: true },
  });

  const base = {
    ok: true,
    teamId: install.teamId,
    teamName: install.teamName,
    botUserId: install.botUserId,
    scopes: install.scopes,
    tokenDecrypts: tokenOk,
    youAreLinked: !!link,
    yourSlackUserId: link?.slackUserId ?? null,
  };

  // Test de posteo directo a tu DM.
  const wantsTest = new URL(req.url).searchParams.get("test") === "1";
  if (!wantsTest) {
    return NextResponse.json({
      ...base,
      hint: "Agrega ?test=1 para que el bot te envíe un DM de prueba.",
    });
  }

  if (!tokenOk) {
    return NextResponse.json({
      ...base,
      testResult: { ok: false, error: "no_bot_token (el token no desencripta)" },
    });
  }
  if (!link?.slackUserId) {
    return NextResponse.json({
      ...base,
      testResult: { ok: false, error: "no_user_link (tu Slack no está vinculado)" },
    });
  }

  // chat.postMessage acepta el user ID como channel y abre el DM si el bot
  // tiene im:write. Esto prueba el posteo SIN depender de eventos/after().
  const result = await postSlackMessage({
    teamId: install.teamId,
    channel: link.slackUserId,
    text: "🔧 Test de Rowi: si ves este mensaje, el bot puede postear. El problema (si lo hay) está en la recepción de eventos.",
  });

  return NextResponse.json({ ...base, testResult: result });
}
