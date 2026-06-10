/**
 * 💬 GET /api/integrations/teams/status
 * Estado de la conexión Teams del tenant del usuario. No devuelve la webhook URL
 * (lleva token embebido) — solo el booleano + nombre del canal.
 */
import { NextResponse } from "next/server";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { getTeamsConnection } from "@/lib/teams/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdminWithScope();
  if (admin.error) return NextResponse.json({ ok: true, connected: false });

  // Resolver el tenant: el del scope, o el primario del usuario.
  const tenantId =
    admin.scope.type !== "rowiverse" && admin.scope.id
      ? admin.scope.id
      : admin.user.primaryTenantId;

  if (!tenantId) return NextResponse.json({ ok: true, connected: false });

  const conn = await getTeamsConnection(tenantId);
  return NextResponse.json({
    ok: true,
    connected: !!conn,
    channelName: conn?.channelName ?? null,
  });
}
