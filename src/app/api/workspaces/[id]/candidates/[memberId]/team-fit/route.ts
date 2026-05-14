import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { canAccessWorkspace } from "@/lib/workspace/permissions";

export const runtime = "nodejs";
export const preferredRegion = "iad1";

/**
 * GET /api/workspaces/[id]/candidates/[memberId]/team-fit?teamId=<communityId>
 *
 * Compares the candidate (from the current SELECTION workspace) against an
 * existing team (another RowiCommunity the user can see). Returns:
 *   - Brain-style distribution of the team
 *   - Whether the candidate complements (different style) or reinforces
 *     (same style) the team
 *   - Average SEI delta per competency (candidate vs team average)
 *   - Overall fit score 0-100 weighting complement + reinforcement of gaps
 */

const COMPETENCIES = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"] as const;

type CompetencyKey = (typeof COMPETENCIES)[number];

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; memberId: string }>;
  },
) {
  try {
    const { id: communityId, memberId } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");
    if (!teamId) {
      return NextResponse.json(
        { error: "teamId query parameter is required" },
        { status: 400 },
      );
    }

    const [accessSource, accessTeam] = await Promise.all([
      canAccessWorkspace(token.sub, communityId),
      canAccessWorkspace(token.sub, teamId),
    ]);
    if (!accessSource.allowed || !accessTeam.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const candidate = await prisma.communityMember.findFirst({
      where: { id: memberId, communityId },
      select: { id: true, name: true, brainStyle: true },
    });
    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 },
      );
    }

    const candidateSnap = await prisma.eqSnapshot.findFirst({
      where: { memberId: candidate.id, dataset: "actual" },
      orderBy: { at: "desc" },
    });

    const team = await prisma.rowiCommunity.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, workspaceType: true },
    });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const teamMembers = await prisma.communityMember.findMany({
      where: { communityId: teamId, status: "ACTIVE" },
      select: { id: true, brainStyle: true, name: true },
    });

    if (teamMembers.length === 0) {
      return NextResponse.json({
        ok: true,
        candidate,
        team,
        teamMembers: 0,
        message: "Target team has no active members.",
        fit: null,
      });
    }

    const teamMemberIds = teamMembers.map((m) => m.id);
    const teamSnaps = await prisma.eqSnapshot.findMany({
      where: { memberId: { in: teamMemberIds }, dataset: "actual" },
      orderBy: { at: "desc" },
    });
    const snapsByMember = new Map<string, (typeof teamSnaps)[number]>();
    for (const s of teamSnaps) {
      if (s.memberId && !snapsByMember.has(s.memberId)) {
        snapsByMember.set(s.memberId, s);
      }
    }

    // Brain style distribution
    const styleCount: Record<string, number> = {};
    for (const m of teamMembers) {
      const key = (m.brainStyle || "Unknown").trim() || "Unknown";
      styleCount[key] = (styleCount[key] || 0) + 1;
    }
    const styleDistribution = Object.entries(styleCount)
      .map(([style, count]) => ({
        style,
        count,
        pct: Math.round((count / teamMembers.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    const dominantStyle =
      styleDistribution.length > 0 ? styleDistribution[0].style : null;
    const candidateStyle = candidate.brainStyle?.trim() || null;
    const styleMatch =
      dominantStyle && candidateStyle
        ? dominantStyle.toLowerCase() === candidateStyle.toLowerCase()
        : null;

    // Team average per competency + overall4
    const sums: Record<string, { sum: number; n: number }> = {};
    const fields: (CompetencyKey | "overall4")[] = [...COMPETENCIES, "overall4"];
    for (const f of fields) sums[f] = { sum: 0, n: 0 };
    for (const s of snapsByMember.values()) {
      for (const f of fields) {
        const v = (s as unknown as Record<string, number | null>)[f];
        if (v != null) {
          sums[f].sum += v;
          sums[f].n += 1;
        }
      }
    }
    const teamAvg: Record<string, number | null> = {};
    for (const f of fields) {
      teamAvg[f] = sums[f].n > 0 ? Math.round((sums[f].sum / sums[f].n) * 10) / 10 : null;
    }

    // Per-competency delta and gap analysis
    const deltas: Record<string, { candidate: number | null; team: number | null; delta: number | null }> = {};
    let gapStrengthScore = 0;
    let gapDenominator = 0;
    for (const c of COMPETENCIES) {
      const candVal = (candidateSnap as unknown as Record<string, number | null> | null)?.[c] ?? null;
      const teamVal = teamAvg[c];
      const delta = candVal != null && teamVal != null ? Math.round((candVal - teamVal) * 10) / 10 : null;
      deltas[c] = { candidate: candVal, team: teamVal, delta };
      // Reward candidate strength in areas where team is weak (below 100)
      if (candVal != null && teamVal != null && teamVal < 100) {
        gapStrengthScore += Math.max(0, candVal - teamVal);
        gapDenominator += 100 - teamVal;
      }
    }

    // Compute composite fit:
    //  - 40% style complement (or reinforcement if team is small)
    //  - 40% candidate strength in team's weak competencies
    //  - 20% overall4 reaching team average
    const styleComponent =
      styleMatch === null
        ? 50
        : styleMatch
          ? teamMembers.length < 3
            ? 80 // small team — reinforce is fine
            : 45 // mature team — same style adds less diversity
          : 80;

    const gapComponent = gapDenominator > 0
      ? Math.min(100, Math.round((gapStrengthScore / gapDenominator) * 100))
      : 50;

    const overallComponent =
      candidateSnap?.overall4 != null && teamAvg.overall4 != null
        ? candidateSnap.overall4 >= teamAvg.overall4
          ? 90
          : Math.max(
              30,
              Math.round(((candidateSnap.overall4 ?? 0) / teamAvg.overall4) * 90),
            )
        : 50;

    const fit = Math.round(
      styleComponent * 0.4 + gapComponent * 0.4 + overallComponent * 0.2,
    );

    return NextResponse.json({
      ok: true,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        brainStyle: candidateStyle,
        overall4: candidateSnap?.overall4 ?? null,
      },
      team: {
        id: team.id,
        name: team.name,
        memberCount: teamMembers.length,
        snapshotCount: snapsByMember.size,
        dominantStyle,
        styleDistribution,
        avg: teamAvg,
      },
      analysis: {
        styleMatch,
        styleVerdict:
          styleMatch === null
            ? "unknown"
            : styleMatch
              ? "reinforces"
              : "complements",
        deltas,
        components: {
          style: styleComponent,
          gap: gapComponent,
          overall: overallComponent,
        },
        fit,
      },
    });
  } catch (e) {
    console.error(
      "[GET /api/workspaces/[id]/candidates/[memberId]/team-fit] error:",
      e,
    );
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 },
    );
  }
}
