/**
 * 💬 GET /api/integrations/slack/status
 * ============================================================
 * Devuelve el estado de conexión de Slack para mostrar en el panel
 * de integraciones. Requiere sesión (no es pública en el middleware).
 *
 * Reporta las instalaciones que el usuario actual realizó
 * (installedByUserId), o todas si es SuperAdmin.
 * ============================================================
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/core/auth/requireAdmin";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user;

  const where = user.isSuperAdmin ? {} : { installedByUserId: user.id };

  const installs = await prisma.slackInstallation.findMany({
    where,
    select: { teamId: true, teamName: true, createdAt: true, tenantId: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    ok: true,
    connected: installs.length > 0,
    installations: installs.map((i) => ({
      teamId: i.teamId,
      teamName: i.teamName,
      tenantId: i.tenantId,
      connectedAt: i.createdAt.toISOString(),
    })),
  });
}
