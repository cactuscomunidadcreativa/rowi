import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAuth } from "@/core/auth/requireAdmin";

export const preferredRegion = "iad1";

/**
 * GET /api/org/summary
 *
 * Returns a snapshot of the authenticated user's primary tenant: who's in it,
 * their EQ averages, top brain styles, recent workspaces, open alerts and
 * country distribution. This is the data behind /org (the tenant Organization
 * Hub — same UX shape as the TP Demo but with real data scoped to the user's
 * own tenant).
 *
 * Available to any authenticated user with a primaryTenantId. Returns
 * `scope: "personal"` (with empty data) if the user has no tenant yet.
 */
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: {
        primaryTenantId: true,
        permissions: { select: { role: true, scopeType: true } },
      },
    });

    const isSuperAdmin = (dbUser?.permissions || []).some(
      (p) => p.role?.toLowerCase() === "superadmin" && p.scopeType === "rowiverse",
    );

    const tenantId = dbUser?.primaryTenantId;
    if (!tenantId) {
      return NextResponse.json({
        ok: true,
        scope: "personal",
        tenant: null,
        summary: null,
        message: "No tenant assigned to this user yet.",
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true },
    });

    const tenantFilter = { tenantId };
    const memberTenantFilter = {
      community: { tenantId },
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      employeesCount,
      activeEmployees,
      pendingLeaves,
      openReviews,
      membersCount,
      membersWithSEI,
      eqAvgAgg,
      workspaces,
      activeWorkspaces,
      brainStyleAgg,
      countryAgg,
      openAlerts,
      criticalAlerts,
      recentSnapshots,
    ] = await Promise.all([
      prisma.employeeProfile.count({ where: tenantFilter }),
      prisma.employeeProfile.count({
        where: { ...tenantFilter, status: "ACTIVE" },
      }),
      prisma.leaveRequest.count({
        where: { status: "PENDING", employee: { tenantId } },
      }),
      prisma.performanceReview.count({
        where: { status: "open", employee: { tenantId } },
      }),
      prisma.communityMember.count({
        where: { tenantId },
      }),
      prisma.communityMember.count({
        where: {
          tenantId,
          snapshots: { some: { dataset: "actual", overall4: { not: null } } },
        },
      }),
      prisma.eqSnapshot.aggregate({
        _avg: { overall4: true, K: true, C: true, G: true },
        where: {
          dataset: "actual",
          member: { tenantId },
          overall4: { not: null },
        },
      }),
      prisma.rowiCommunity.findMany({
        where: tenantFilter,
        select: {
          id: true,
          name: true,
          description: true,
          workspaceType: true,
          projectStatus: true,
          createdAt: true,
          _count: { select: { communityMembers: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.rowiCommunity.count({
        where: { ...tenantFilter, projectStatus: "active" },
      }),
      prisma.communityMember.groupBy({
        by: ["brainStyle"],
        where: { tenantId, brainStyle: { not: null } },
        _count: true,
        orderBy: { _count: { brainStyle: "desc" } },
        take: 6,
      }),
      prisma.communityMember.groupBy({
        by: ["country"],
        where: { tenantId, country: { not: null } },
        _count: true,
        orderBy: { _count: { country: "desc" } },
        take: 8,
      }),
      prisma.workspaceAlert.count({
        where: {
          community: { tenantId },
          resolvedAt: null,
          dismissedAt: null,
        },
      }),
      prisma.workspaceAlert.count({
        where: {
          community: { tenantId },
          severity: "critical",
          resolvedAt: null,
          dismissedAt: null,
        },
      }),
      prisma.eqSnapshot.count({
        where: {
          dataset: "actual",
          member: memberTenantFilter,
          at: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      scope: "tenant",
      isSuperAdmin,
      tenant,
      summary: {
        people: {
          employees: employeesCount,
          activeEmployees,
          members: membersCount,
          withSEI: membersWithSEI,
        },
        hr: {
          pendingLeaves,
          openReviews,
        },
        eq: {
          avgOverall: eqAvgAgg._avg.overall4
            ? Math.round(eqAvgAgg._avg.overall4 * 10) / 10
            : null,
          avgK: eqAvgAgg._avg.K ? Math.round(eqAvgAgg._avg.K * 10) / 10 : null,
          avgC: eqAvgAgg._avg.C ? Math.round(eqAvgAgg._avg.C * 10) / 10 : null,
          avgG: eqAvgAgg._avg.G ? Math.round(eqAvgAgg._avg.G * 10) / 10 : null,
        },
        workspaces: {
          total: workspaces.length,
          active: activeWorkspaces,
          recent: workspaces,
        },
        diversity: {
          brainStyles: brainStyleAgg
            .filter((b) => b.brainStyle)
            .map((b) => ({ style: b.brainStyle as string, count: b._count })),
          countries: countryAgg
            .filter((c) => c.country)
            .map((c) => ({ country: c.country as string, count: c._count })),
        },
        alerts: {
          open: openAlerts,
          critical: criticalAlerts,
        },
        activity: {
          snapshotsLast30Days: recentSnapshots,
        },
      },
    });
  } catch (e) {
    console.error("[api/org/summary] error:", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 },
    );
  }
}
