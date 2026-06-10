export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

/**
 * Aggregate Vital Signs scores across all assessments matching the requested scope.
 *
 * Query params:
 *   scope: team | org | leader
 *   subjectId: optional, narrow to a specific subject
 *   dataset: production | sample | test  (default production)
 *
 * Privacy: enforces N >= 5 per dimension. Subgroups with insufficient sample are suppressed.
 */
const MIN_SAMPLE_N = 5;

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") ?? "team"; // team | org | leader
    const subjectId = url.searchParams.get("subjectId");
    const dataset = url.searchParams.get("dataset") ?? "production";

    const where: Record<string, unknown> = {
      dataset,
      status: { in: ["active", "completed"] },
    };
    if (scope === "team") where.scope = "TVS";
    else if (scope === "org") where.scope = "OVS";
    else if (scope === "leader") where.scope = "LVS";
    if (subjectId) where.subjectId = subjectId;

    const assessments = await prisma.vitalSignsAssessment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        scores: true,
        _count: { select: { responses: true } },
      },
    });

    const totalRespondents = assessments.reduce(
      (sum, a) => sum + a._count.responses,
      0,
    );

    if (totalRespondents < MIN_SAMPLE_N) {
      return NextResponse.json({
        ok: true,
        suppressed: true,
        reason: `N < ${MIN_SAMPLE_N}`,
        sampleSize: totalRespondents,
      });
    }

    const dimensionMap = new Map<string, { sumWeighted: number; sumN: number; sdValues: number[]; level: string }>();
    for (const a of assessments) {
      for (const s of a.scores) {
        const key = `${s.level}::${s.dimension}`;
        const entry = dimensionMap.get(key) ?? {
          sumWeighted: 0,
          sumN: 0,
          sdValues: [],
          level: s.level,
        };
        entry.sumWeighted += s.scoreMean * s.n;
        entry.sumN += s.n;
        if (s.scoreSD !== null) entry.sdValues.push(s.scoreSD);
        dimensionMap.set(key, entry);
      }
    }

    const aggregated = Array.from(dimensionMap.entries()).map(([key, v]) => {
      const [level, dimension] = key.split("::");
      const mean = v.sumN > 0 ? v.sumWeighted / v.sumN : 0;
      const sd = v.sdValues.length > 0
        ? v.sdValues.reduce((a, b) => a + b, 0) / v.sdValues.length
        : null;
      return {
        level,
        dimension,
        mean,
        sd,
        n: v.sumN,
        cohesionBand: sd === null ? null : sd < 12 ? "high" : sd > 18 ? "low" : "mid",
        strengthBand: mean < 90 ? "bottom_quartile" : mean >= 110 ? "top_quartile" : "mid",
        benchmarkDelta: mean - 100,
        suppressed: v.sumN < MIN_SAMPLE_N,
      };
    });

    // Compute engagement index: % of respondents who would be "engaged" based on driver mean >= 110
    const drivers = aggregated.filter((a) => a.level === "driver");
    const overallDriverMean = drivers.length > 0
      ? drivers.reduce((sum, d) => sum + d.mean, 0) / drivers.length
      : 0;
    // Approximate engagement index 0-100 from normalized driver mean
    const engagementIndex = Math.round(
      Math.max(0, Math.min(100, ((overallDriverMean - 70) / 60) * 100)),
    );

    return NextResponse.json({
      ok: true,
      scope,
      subjectId,
      dataset,
      assessmentCount: assessments.length,
      sampleSize: totalRespondents,
      engagementIndex,
      overallDriverMean,
      scores: aggregated,
    });
  } catch (e: unknown) {
    console.error("/api/vital-signs/aggregate error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
