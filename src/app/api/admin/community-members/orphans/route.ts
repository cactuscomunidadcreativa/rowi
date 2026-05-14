// src/app/api/admin/community-members/orphans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";

export const runtime = "nodejs";
export const preferredRegion = "iad1";

/**
 * GET /api/admin/community-members/orphans
 *
 * Returns CommunityMember rows that have a tenantId but no communityId
 * — people we imported into a tenant but never assigned to any
 * workspace. These are the "33 huérfanos" mentioned in the org summary;
 * an admin needs them visible to clean them up.
 *
 * Optional ?tenantId=X narrows to a single tenant. Without it, scope-
 * aware: rowiverse admins see all, tenant admins only their tenant.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  const url = new URL(req.url);
  const requestedTenantId = url.searchParams.get("tenantId");

  // Orphan = has a tenant but no community.
  // tenantId is required (non-null) on the model, so we only check
  // communityId here.
  const where: Record<string, unknown> = {
    communityId: null,
  };

  if (auth.scope.type === "rowiverse") {
    if (requestedTenantId) where.tenantId = requestedTenantId;
  } else if (auth.scope.type === "tenant") {
    where.tenantId = auth.scope.id;
  } else if (auth.scope.type === "hub" || auth.scope.type === "superhub") {
    // Resolve which tenant(s) this hub/superhub reaches and filter to them.
    let tenantIds: string[] = [];
    if (auth.scope.type === "hub") {
      const hub = await prisma.hub.findUnique({
        where: { id: auth.scope.id! },
        select: { tenantId: true },
      });
      if (hub?.tenantId) tenantIds.push(hub.tenantId);
    } else {
      const sh = await prisma.superHub.findUnique({
        where: { id: auth.scope.id! },
        select: { tenants: { select: { id: true } } },
      });
      tenantIds = (sh?.tenants || []).map((t) => t.id);
    }
    if (tenantIds.length === 0) {
      return NextResponse.json({ ok: true, rows: [], total: 0 });
    }
    if (
      requestedTenantId &&
      tenantIds.includes(requestedTenantId)
    ) {
      where.tenantId = requestedTenantId;
    } else {
      where.tenantId = { in: tenantIds };
    }
  }

  const [rows, total, candidateCommunities] = await Promise.all([
    prisma.communityMember.findMany({
      where,
      orderBy: { joinedAt: "desc" },
      take: 500,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        joinedAt: true,
        tenant: { select: { id: true, name: true } },
      },
    }),
    prisma.communityMember.count({ where }),
    // Provide a list of communities the admin can assign to. We constrain
    // to those in the same tenant set so the UI doesn't show cross-tenant
    // options that the create call would reject anyway.
    prisma.rowiCommunity.findMany({
      where: where.tenantId ? { tenantId: where.tenantId as any } : {},
      orderBy: { name: "asc" },
      take: 200,
      select: {
        id: true,
        name: true,
        slug: true,
        tenantId: true,
        workspaceType: true,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    rows,
    total,
    candidateCommunities,
  });
}
