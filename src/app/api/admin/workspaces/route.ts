/**
 * GET /api/admin/workspaces
 *
 * Lista los workspaces (RowiCommunity con workspaceType definido) que el
 * admin caller puede gestionar. Scope-aware: rowiverse admin ve todos,
 * tenant admin solo los de sus tenants.
 *
 * Filtros opcionales por query:
 *   - workspaceType: COACHING | SELECTION | TEAM_UNIT | HR_COHORT | MENTORING
 *   - projectStatus: active | paused | completed | archived
 *   - search: substring en name o slug
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { tenantIdsForScope } from "@/core/admin/scopedList";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminWithScope();
    if (auth.error || !auth.scope) {
      return auth.error ?? NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const allowedTenantIds = await tenantIdsForScope(auth.scope);

    const { searchParams } = new URL(req.url);
    const workspaceType = searchParams.get("workspaceType");
    const projectStatus = searchParams.get("projectStatus");
    const search = (searchParams.get("search") ?? "").trim();

    const where: Record<string, unknown> = {
      workspaceType: { not: null },
    };
    if (workspaceType) where.workspaceType = workspaceType;
    if (projectStatus) where.projectStatus = projectStatus;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }
    if (allowedTenantIds !== null) {
      where.tenantId = { in: allowedTenantIds };
    }

    const items = await prisma.rowiCommunity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        workspaceType: true,
        projectStatus: true,
        targetRole: true,
        projectStartDate: true,
        projectEndDate: true,
        clientOrgId: true,
        createdAt: true,
        updatedAt: true,
        tenant: { select: { id: true, name: true, slug: true } },
        clientOrg: { select: { id: true, name: true } },
        _count: {
          select: {
            members: true,
            communityMembers: true,
            serviceEngagements: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: unknown) {
    console.error("/api/admin/workspaces GET error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
