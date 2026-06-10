import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAuth } from "@/core/auth/requireAdmin";

export const runtime = "nodejs";
export const preferredRegion = "iad1";

/**
 * GET /api/people/lookup?email=person@example.com
 *
 * Cross-workspace search by email. Returns any existing history we can find
 * for this person so the caller (a coach onboarding a new coachee, an HR
 * manager adding an employee, a recruiter creating a candidate, etc.) can
 * pull the data instead of capturing it from scratch.
 *
 * Permission model — returns ONLY records the caller can already access:
 *   - User account: returned if the caller is SuperAdmin OR shares a tenant.
 *   - CommunityMember rows: only from workspaces the caller is a member of.
 *   - RowiVerseUser: always returned if linked (the global Rowi identity).
 *   - Most recent EqSnapshot: from one of the accessible CommunityMembers,
 *     plus the AffinitySnapshot count for the same identity.
 *
 * If nothing matches, returns `{ found: false }`. The response is shaped to
 * be safe to drop into the AddCandidateModal / invite flow forms.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "valid email required" },
      { status: 400 },
    );
  }

  try {
    const callerId = auth.user.id;
    const caller = await prisma.user.findUnique({
      where: { id: callerId },
      select: {
        primaryTenantId: true,
        permissions: { select: { role: true, scopeType: true, scopeId: true } },
      },
    });

    const isSuperAdmin = (caller?.permissions || []).some(
      (p) =>
        p.role?.toLowerCase() === "superadmin" && p.scopeType === "rowiverse",
    );

    // Workspaces the caller can see (member or admin).
    const callerMemberships = await prisma.rowiCommunityUser.findMany({
      where: { userId: callerId },
      select: { communityId: true },
    });
    const accessibleCommunityIds = callerMemberships.map((m) => m.communityId);

    // 1) User account match
    const userMatch = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        primaryTenantId: true,
        image: true,
        rowiverse: {
          select: { id: true, name: true, email: true, country: true },
        },
      },
    });

    const sharesTenant =
      userMatch?.primaryTenantId &&
      caller?.primaryTenantId &&
      userMatch.primaryTenantId === caller.primaryTenantId;
    const canSeeUser = isSuperAdmin || sharesTenant;

    // 2) CommunityMember matches — only within accessible workspaces (unless SuperAdmin).
    const memberWhere: Record<string, unknown> = { email };
    if (!isSuperAdmin) {
      memberWhere.communityId = { in: accessibleCommunityIds };
    }
    const memberMatches = await prisma.communityMember.findMany({
      where: memberWhere,
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        country: true,
        brainStyle: true,
        role: true,
        source: true,
        joinedAt: true,
        community: {
          select: { id: true, name: true, workspaceType: true },
        },
      },
      orderBy: { joinedAt: "desc" },
      take: 10,
    });

    // 3) Most recent EqSnapshot from any accessible member.
    let latestSnapshot: {
      id: string;
      at: Date;
      overall4: number | null;
      K: number | null;
      C: number | null;
      G: number | null;
      EL: number | null;
      RP: number | null;
      ACT: number | null;
      NE: number | null;
      IM: number | null;
      OP: number | null;
      EMP: number | null;
      NG: number | null;
      brainStyle: string | null;
      memberId: string | null;
    } | null = null;
    if (memberMatches.length > 0) {
      const memberIds = memberMatches.map((m) => m.id);
      latestSnapshot = await prisma.eqSnapshot.findFirst({
        where: {
          memberId: { in: memberIds },
          dataset: "actual",
        },
        orderBy: { at: "desc" },
      });
    }

    // 4) Affinity snapshots — count only.
    let affinityCount = 0;
    if (userMatch?.id) {
      affinityCount = await prisma.affinitySnapshot.count({
        where: { userId: userMatch.id },
      });
    }

    const found =
      (canSeeUser && !!userMatch) ||
      memberMatches.length > 0 ||
      !!userMatch?.rowiverse;

    return NextResponse.json({
      ok: true,
      found,
      email,
      user: canSeeUser && userMatch
        ? {
            id: userMatch.id,
            name: userMatch.name,
            email: userMatch.email,
            image: userMatch.image,
            sameTenant: !!sharesTenant,
            rowiverseUser: userMatch.rowiverse,
          }
        : null,
      members: memberMatches.map((m) => ({
        id: m.id,
        name: m.name,
        firstName: m.firstName,
        lastName: m.lastName,
        country: m.country,
        brainStyle: m.brainStyle,
        role: m.role,
        source: m.source,
        createdAt: m.joinedAt,
        community: m.community,
      })),
      latestSnapshot: latestSnapshot
        ? {
            at: latestSnapshot.at,
            overall4: latestSnapshot.overall4,
            K: latestSnapshot.K,
            C: latestSnapshot.C,
            G: latestSnapshot.G,
            EL: latestSnapshot.EL,
            RP: latestSnapshot.RP,
            ACT: latestSnapshot.ACT,
            NE: latestSnapshot.NE,
            IM: latestSnapshot.IM,
            OP: latestSnapshot.OP,
            EMP: latestSnapshot.EMP,
            NG: latestSnapshot.NG,
            brainStyle: latestSnapshot.brainStyle,
          }
        : null,
      affinitySnapshotsCount: affinityCount,
    });
  } catch (e) {
    console.error("[api/people/lookup] error:", e);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
