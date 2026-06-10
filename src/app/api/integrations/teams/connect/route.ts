/**
 * 💬 POST /api/integrations/teams/connect
 * Conecta Teams pegando la URL de un Incoming Webhook de canal.
 * Body: { webhookUrl, channelName? }. Solo admin del tenant.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { upsertTeamsConnection, isValidTeamsWebhook } from "@/lib/teams/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await requireAdminWithScope();
  if (admin.error) return admin.error;

  const tenantId =
    admin.scope.type !== "rowiverse" && admin.scope.id
      ? admin.scope.id
      : admin.user.primaryTenantId;
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "no_tenant" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    webhookUrl?: string;
    channelName?: string;
  };
  const webhookUrl = (body.webhookUrl || "").trim();

  if (!isValidTeamsWebhook(webhookUrl)) {
    return NextResponse.json(
      { ok: false, error: "invalid_webhook_url" },
      { status: 400 },
    );
  }

  const conn = await upsertTeamsConnection({
    tenantId,
    userId: admin.user.id,
    webhookUrl,
    channelName: body.channelName?.trim() || null,
  });

  return NextResponse.json({
    ok: true,
    connected: true,
    channelName: conn.channelName,
  });
}
