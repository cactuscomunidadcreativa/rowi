export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/**
 * GET /api/admin/vital-signs/benchmark
 *
 * Returns a per-scope summary of the VS rowiverse benchmark:
 *   - contributing rows (ScoreSource with contributesToBenchmark=true)
 *   - global stats (mean/sd/percentiles per dimension)
 *   - top correlations by |r|
 *
 * Used by /hub/admin/vital-signs/benchmark.
 */
export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const SCOPES = ["OVS", "TVS", "LVS", "FVS"] as const;

  const summary = await Promise.all(
    SCOPES.map(async (scope) => {
      const [contributing, lastSource, lastStat, globalStats, topCorrelations, assessmentCount] =
        await Promise.all([
          prisma.vitalSignsScoreSource.count({
            where: { scope, contributesToBenchmark: true },
          }),
          prisma.vitalSignsScoreSource.findFirst({
            where: { scope, contributesToBenchmark: true },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
          }),
          prisma.vitalSignsBenchmarkStat.findFirst({
            where: { scope },
            orderBy: { calculatedAt: "desc" },
            select: { calculatedAt: true, version: true },
          }),
          prisma.vitalSignsBenchmarkStat.findMany({
            where: { scope, country: null, region: null, sector: null, ageRange: null, gender: null },
            orderBy: [{ level: "asc" }, { dimension: "asc" }],
            select: { dimension: true, level: true, n: true, mean: true, sd: true, p25: true, p50: true, p75: true },
          }),
          prisma.vitalSignsBenchmarkCorrelation.findMany({
            where: { scope, country: null, region: null, sector: null },
            orderBy: { correlation: "desc" },
            take: 10,
            select: { xKey: true, yKey: true, correlation: true, n: true },
          }),
          prisma.vitalSignsAssessment.count({ where: { scope } }),
        ]);

      return {
        scope,
        assessmentCount,
        contributingRows: contributing,
        lastDataAddedAt: lastSource?.createdAt ?? null,
        lastRecomputedAt: lastStat?.calculatedAt ?? null,
        statsVersion: lastStat?.version ?? null,
        globalStats,
        topCorrelations,
      };
    }),
  );

  return NextResponse.json({ ok: true, summary });
}
