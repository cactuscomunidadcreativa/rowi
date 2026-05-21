export const runtime = "nodejs";

/**
 * GET /api/admin/coaching/clients/[id]/resolve
 *
 * Given a ClientAccess.id, returns the linked User (looked up by clientEmail)
 * so the UI can deep-link to user-scoped pages like vital-signs.
 *
 * Returns { ok, clientUserId | null, clientEmail, clientName }.
 * SuperAdmin or ADMIN of the community's tenant.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getServerAuthUser();
  if (!auth) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!["SUPERADMIN", "ADMIN"].includes(auth.organizationRole ?? "")) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const access = await prisma.clientAccess.findUnique({
    where: { id },
    select: { clientEmail: true, clientName: true, community: { select: { tenantId: true } } },
  });
  if (!access) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  if (!auth.isSuperAdmin && access.community.tenantId !== auth.primaryTenantId) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { email: access.clientEmail.toLowerCase() },
    select: { id: true },
  });

  return NextResponse.json({
    ok: true,
    clientUserId: user?.id ?? null,
    clientEmail: access.clientEmail,
    clientName: access.clientName,
  });
}
