import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAuth } from "@/core/auth/requireAdmin";

export const preferredRegion = "iad1";

/**
 * GET /api/org/summary
 *
 * Returns a snapshot of the authenticated user's organization. We resolve
 * the "tenants this user belongs to" from every source the data model
 * gives us:
 *   - User.primaryTenantId
 *   - Membership records (tenant-level membership)
 *   - HubMembership → hub.tenantId
 *   - RowiCommunityUser → community.tenantId (workspaces they manage/are in)
 *   - CommunityMember (managed members imported with their email) → community.tenantId
 *
 * That makes the page work for a coach/HR/consultant whose account was
 * never given a primaryTenantId but who is wired into the workspaces via
 * any of the membership shapes above.
 *
 * Available to any authenticated user. Returns `scope: "personal"` with
 * empty data if we couldn't link them to any tenant.
 */
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const userId = auth.user.id;
    const userEmail = (auth.user.email || "").toLowerCase();

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        primaryTenantId: true,
        permissions: { select: { role: true, scopeType: true, scopeId: true } },
      },
    });

    const isSuperAdmin = (dbUser?.permissions || []).some(
      (p) =>
        p.role?.toLowerCase() === "superadmin" && p.scopeType === "rowiverse",
    );

    // ── Resolve every tenant ID this user has any kind of access to.
    const [memberships, hubMemberships, communityUsers, communityMembers] =
      await Promise.all([
        prisma.membership.findMany({
          where: { userId },
          select: { tenantId: true },
        }),
        prisma.hubMembership.findMany({
          where: { userId },
          select: { hub: { select: { tenantId: true } } },
        }),
        prisma.rowiCommunityUser.findMany({
          where: { userId },
          select: { community: { select: { tenantId: true } } },
        }),
        userEmail
          ? prisma.communityMember.findMany({
              where: { email: userEmail },
              select: { community: { select: { tenantId: true } } },
            })
          : Promise.resolve([]),
      ]);

    const tenantIdSet = new Set<string>();
    if (dbUser?.primaryTenantId) tenantIdSet.add(dbUser.primaryTenantId);
    for (const m of memberships) if (m.tenantId) tenantIdSet.add(m.tenantId);
    for (const h of hubMemberships) {
      if (h.hub?.tenantId) tenantIdSet.add(h.hub.tenantId);
    }
    for (const c of communityUsers) {
      if (c.community?.tenantId) tenantIdSet.add(c.community.tenantId);
    }
    for (const c of communityMembers) {
      if (c.community?.tenantId) tenantIdSet.add(c.community.tenantId);
    }

    const tenantIds = Array.from(tenantIdSet);

    if (tenantIds.length === 0) {
      return NextResponse.json({
        ok: true,
        scope: "personal",
        tenant: null,
        summary: null,
        message: "No tenant assigned to this user yet.",
      });
    }

    // Use the first tenant for the display name. The summary aggregates
    // across ALL accessible tenants — useful when a consultant is wired
    // into more than one client tenant.
    const primaryDisplayTenant = await prisma.tenant.findFirst({
      where: {
        id: dbUser?.primaryTenantId
          ? dbUser.primaryTenantId
          : { in: tenantIds },
      },
      select: { id: true, name: true, slug: true },
    });

    const tenantFilter = { tenantId: { in: tenantIds } };
    const memberTenantFilter = {
      community: { tenantId: { in: tenantIds } },
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
        where: { status: "PENDING", employee: { tenantId: { in: tenantIds } } },
      }),
      prisma.performanceReview.count({
        where: { status: "open", employee: { tenantId: { in: tenantIds } } },
      }),
      prisma.communityMember.count({
        where: tenantFilter,
      }),
      prisma.communityMember.count({
        where: {
          ...tenantFilter,
          snapshots: { some: { dataset: "actual", overall4: { not: null } } },
        },
      }),
      prisma.eqSnapshot.aggregate({
        _avg: { overall4: true, K: true, C: true, G: true },
        where: {
          dataset: "actual",
          member: tenantFilter,
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
        where: { ...tenantFilter, brainStyle: { not: null } },
        _count: true,
        orderBy: { _count: { brainStyle: "desc" } },
        take: 6,
      }),
      prisma.communityMember.groupBy({
        by: ["country"],
        where: { ...tenantFilter, country: { not: null } },
        _count: true,
        orderBy: { _count: { country: "desc" } },
        take: 8,
      }),
      prisma.workspaceAlert.count({
        where: {
          community: { tenantId: { in: tenantIds } },
          resolvedAt: null,
          dismissedAt: null,
        },
      }),
      prisma.workspaceAlert.count({
        where: {
          community: { tenantId: { in: tenantIds } },
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
      tenant: primaryDisplayTenant,
      tenantCount: tenantIds.length,
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
