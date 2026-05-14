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
      membersWithBrainStyle,
      snapshotsForDiversity,
      openAlerts,
      criticalAlerts,
      recentSnapshots,
      // Real members-per-workspace counts — Prisma's `_count` was returning 0
      // for some legacy communities, so we compute it from a groupBy.
      memberByCommunity,
      orphanMembers,
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
          snapshots: { some: { overall4: { not: null } } },
        },
      }),
      // EQ average: include snapshots reachable from EITHER a CommunityMember
      // in our tenants OR a User whose primaryTenantId is in our tenants. The
      // dataset filter is intentionally loose — different import paths use
      // "actual", "imported", "csv" etc.; we average across all of them.
      prisma.eqSnapshot.aggregate({
        _avg: { overall4: true, K: true, C: true, G: true },
        where: {
          overall4: { not: null },
          OR: [
            { member: { tenantId: { in: tenantIds } } },
            { user: { primaryTenantId: { in: tenantIds } } },
          ],
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
      // Brain style + country sources — CommunityMember has these fields
      // directly, AND EqSnapshot does too. We fetch every person who has
      // EITHER field populated (so members with only a country, no brain
      // style, still show up in the country distribution).
      prisma.communityMember.findMany({
        where: {
          ...tenantFilter,
          OR: [
            { brainStyle: { not: null } },
            { country: { not: null } },
          ],
        },
        select: { id: true, brainStyle: true, country: true },
      }),
      prisma.eqSnapshot.findMany({
        where: {
          OR: [
            { brainStyle: { not: null } },
            { country: { not: null } },
          ],
          AND: {
            OR: [
              { member: { tenantId: { in: tenantIds } } },
              { user: { primaryTenantId: { in: tenantIds } } },
            ],
          },
        },
        select: {
          brainStyle: true,
          country: true,
          memberId: true,
          userId: true,
          at: true,
        },
        orderBy: { at: "desc" },
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
      // Snapshots in the last 30 days — same OR-based reach as the EQ average.
      prisma.eqSnapshot.count({
        where: {
          at: { gte: thirtyDaysAgo },
          OR: [
            { member: { tenantId: { in: tenantIds } } },
            { user: { primaryTenantId: { in: tenantIds } } },
          ],
        },
      }),
      prisma.communityMember.groupBy({
        by: ["communityId"],
        where: { ...tenantFilter, communityId: { not: null } },
        _count: true,
      }),
      prisma.communityMember.count({
        where: { ...tenantFilter, communityId: null },
      }),
    ]);

    // Build a quick lookup so we can attach real counts to the workspace cards.
    const memberCountByCommunity = new Map<string, number>();
    for (const row of memberByCommunity) {
      if (row.communityId) memberCountByCommunity.set(row.communityId, row._count);
    }

    // ── Merge brain style + country distributions from CommunityMember AND
    // EqSnapshot. People are deduplicated by (memberId | userId) so we don't
    // double-count someone who has both a member row and snapshots.
    //
    // Normalize values: trim + casefold for the bucket key, keep the first
    // seen original casing for the display label. That way "Peru" / "Perú" /
    // " peru " all collapse to a single bucket without losing accents.
    type Bucket = { count: number; label: string };
    const brainStyleBuckets = new Map<string, Bucket>();
    const countryBuckets = new Map<string, Bucket>();
    const seenMemberKeys = new Set<string>();

    function bump(map: Map<string, Bucket>, raw: string | null) {
      if (!raw) return;
      const label = raw.trim();
      if (!label) return;
      const key = label.toLocaleLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
      const existing = map.get(key);
      if (existing) {
        existing.count++;
      } else {
        map.set(key, { count: 1, label });
      }
    }

    for (const m of membersWithBrainStyle) {
      seenMemberKeys.add(`m:${m.id}`);
      bump(brainStyleBuckets, m.brainStyle);
      bump(countryBuckets, m.country);
    }

    // Snapshots are pre-ordered desc by `at` — take the first one per person.
    const handledFromSnapshot = new Set<string>();
    for (const s of snapshotsForDiversity) {
      const key = s.memberId
        ? `m:${s.memberId}`
        : s.userId
          ? `u:${s.userId}`
          : null;
      if (!key) continue;
      if (seenMemberKeys.has(key) || handledFromSnapshot.has(key)) continue;
      handledFromSnapshot.add(key);
      bump(brainStyleBuckets, s.brainStyle);
      bump(countryBuckets, s.country);
    }

    const brainStyleAggMerged = Array.from(brainStyleBuckets.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((b) => ({ style: b.label, count: b.count }));
    const countryAggMerged = Array.from(countryBuckets.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((b) => ({ country: b.label, count: b.count }));

    // ── Hubs + non-workspace communities + affinity surfaces.
    // The org hub is the place where all the pieces of the hierarchy should
    // be visible at a glance: hubs (org units), workspaces (active projects),
    // communities (broader groupings), affinity (relational health).
    const [hubs, communitiesAll, affinityProfiles, affinitySnapshots] =
      await Promise.all([
        prisma.hub.findMany({
          where: tenantFilter,
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            _count: {
              select: {
                memberships: true,
                organizations: true,
                organizationLinks: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 6,
        }),
        prisma.rowiCommunity.findMany({
          where: { ...tenantFilter, workspaceType: null },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            type: true,
            createdAt: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 6,
        }),
        prisma.affinityProfile.count({
          where: { user: { primaryTenantId: { in: tenantIds } } },
        }),
        prisma.affinitySnapshot.count({
          where: { user: { primaryTenantId: { in: tenantIds } } },
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
          recent: workspaces.map((w) => ({
            ...w,
            _count: {
              communityMembers:
                memberCountByCommunity.get(w.id) ?? w._count.communityMembers,
            },
          })),
          orphanMembers,
        },
        diversity: {
          brainStyles: brainStyleAggMerged,
          countries: countryAggMerged,
        },
        alerts: {
          open: openAlerts,
          critical: criticalAlerts,
        },
        activity: {
          snapshotsLast30Days: recentSnapshots,
        },
        hubs: {
          total: hubs.length,
          recent: hubs,
        },
        communities: {
          total: communitiesAll.length,
          recent: communitiesAll,
        },
        affinity: {
          profiles: affinityProfiles,
          snapshots: affinitySnapshots,
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
