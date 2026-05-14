import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { canAccessWorkspace } from "@/lib/workspace/permissions";
import { regionFromCountry } from "@/lib/hiring/region";

export const runtime = "nodejs";
export const preferredRegion = "iad1";

/**
 * GET /api/workspaces/[id]/candidates/[memberId]/positioning
 *
 * Returns the candidate's percentile rank in three scopes:
 *   - global  (all BenchmarkDataPoint with eqTotal/overall4)
 *   - region  (derived from candidate.country)
 *   - country (exact match on candidate.country)
 *
 * Also returns rank for each of the 8 SEI competencies in the global scope.
 */

const COMPETENCIES = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"] as const;

async function percentile(
  field: string,
  value: number,
  where: Record<string, unknown>,
): Promise<{ percentile: number; sampleSize: number } | null> {
  const filter = { ...where, [field]: { not: null } } as Record<string, unknown>;
  const [sampleSize, below] = await Promise.all([
    prisma.benchmarkDataPoint.count({ where: filter }),
    prisma.benchmarkDataPoint.count({
      where: { ...filter, [field]: { lt: value } },
    }),
  ]);
  if (sampleSize === 0) return null;
  return {
    percentile: Math.round((below / sampleSize) * 100),
    sampleSize,
  };
}

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
    const { allowed } = await canAccessWorkspace(token.sub, communityId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const member = await prisma.communityMember.findFirst({
      where: { id: memberId, communityId },
      select: { id: true, name: true, country: true, role: true },
    });
    if (!member) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const snapshot = await prisma.eqSnapshot.findFirst({
      where: { memberId: member.id, dataset: "actual" },
      orderBy: { at: "desc" },
    });
    if (!snapshot) {
      return NextResponse.json({
        ok: true,
        candidate: member,
        snapshot: null,
        positioning: null,
        message: "No SEI snapshot available for this candidate yet.",
      });
    }

    const overall = snapshot.overall4 ?? null;
    if (overall == null) {
      return NextResponse.json({
        ok: true,
        candidate: member,
        snapshot,
        positioning: null,
        message: "Candidate has no overall4 score.",
      });
    }

    const region = regionFromCountry(member.country);

    const [global, regional, countryRank] = await Promise.all([
      percentile("overall4", overall, {}),
      region !== "OTHER"
        ? percentile("overall4", overall, { region })
        : Promise.resolve(null),
      member.country
        ? percentile("overall4", overall, { country: member.country })
        : Promise.resolve(null),
    ]);

    const competencies: Record<string, {
      value: number;
      percentile: number;
      sampleSize: number;
    } | null> = {};
    for (const c of COMPETENCIES) {
      const v = (snapshot as unknown as Record<string, number | null>)[c];
      if (v != null) {
        const p = await percentile(c, v, {});
        competencies[c] = p ? { value: v, ...p } : null;
      } else {
        competencies[c] = null;
      }
    }

    return NextResponse.json({
      ok: true,
      candidate: member,
      snapshot: {
        overall4: overall,
        K: snapshot.K,
        C: snapshot.C,
        G: snapshot.G,
        brainStyle: snapshot.brainStyle,
      },
      positioning: {
        region,
        global,
        regional,
        country: countryRank,
        competencies,
      },
    });
  } catch (e) {
    console.error(
      "[GET /api/workspaces/[id]/candidates/[memberId]/positioning] error:",
      e,
    );
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 },
    );
  }
}
