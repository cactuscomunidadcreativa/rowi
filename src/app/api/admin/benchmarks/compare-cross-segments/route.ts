/**
 * 📊 API: Cross-Benchmark Segment Comparison
 * POST /api/admin/benchmarks/compare-cross-segments
 * Permite comparar segmentos de DIFERENTES benchmarks
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

interface SegmentWithBenchmark {
  name: string;
  benchmarkId: string;
  country?: string;
  region?: string;
  sector?: string;
  jobFunction?: string;
  jobRole?: string;
  ageRange?: string;
  gender?: string;
  education?: string;
  year?: string;
  month?: string;
  quarter?: string;
}

interface CrossCompareRequest {
  segments: SegmentWithBenchmark[];
  metricGroups?: string[];
}

// Métricas por grupo
const METRIC_GROUPS: Record<string, string[]> = {
  core: ["K", "C", "G", "eqTotal"],
  competencies: ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"],
  outcomes: [
    "effectiveness", "relationships", "qualityOfLife", "wellbeing",
    "influence", "decisionMaking", "community", "network",
    "achievement", "satisfaction", "balance", "health",
  ],
  talents: [
    "dataMining", "modeling", "prioritizing", "connection", "emotionalInsight", "collaboration",
    "reflecting", "adaptability", "criticalThinking", "resilience", "riskTolerance", "imagination",
    "proactivity", "commitment", "problemSolving", "vision", "designing", "entrepreneurship",
  ],
};

// Calcular estadísticas para un segmento
async function calculateSegmentStats(
  benchmarkId: string,
  filters: Partial<SegmentWithBenchmark>,
  metrics: string[]
) {
  const where: any = { benchmarkId };

  if (filters.country) where.country = filters.country;
  if (filters.region) where.region = filters.region;
  if (filters.sector) where.sector = filters.sector;
  if (filters.jobFunction) where.jobFunction = filters.jobFunction;
  if (filters.jobRole) where.jobRole = filters.jobRole;
  if (filters.ageRange) where.ageRange = filters.ageRange;
  if (filters.gender) where.gender = filters.gender;
  if (filters.education) where.education = filters.education;

  const statistics: Record<string, any> = {};

  for (const metric of metrics) {
    const dataPoints = await prisma.benchmarkDataPoint.findMany({
      where: {
        ...where,
        [metric]: { not: null },
      },
      select: { [metric]: true },
    });

    const values = dataPoints
      .map((dp: any) => dp[metric])
      .filter((v: any) => v !== null && v !== undefined)
      .sort((a: number, b: number) => a - b);

    const n = values.length;
    if (n === 0) continue;

    const sum = values.reduce((a: number, b: number) => a + b, 0);
    const mean = sum / n;

    const variance = values.reduce((acc: number, val: number) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const getPercentile = (p: number) => {
      const idx = Math.floor((p / 100) * (n - 1));
      return values[idx];
    };

    statistics[metric] = {
      n,
      mean,
      median: getPercentile(50),
      stdDev,
      min: values[0],
      max: values[n - 1],
      p10: getPercentile(10),
      p25: getPercentile(25),
      p50: getPercentile(50),
      p75: getPercentile(75),
      p90: getPercentile(90),
      p95: getPercentile(95),
    };
  }

  return statistics;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const headerEmail = req.headers.get("x-user-email");

    if (!session?.user?.email && !headerEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CrossCompareRequest = await req.json();
    const { segments, metricGroups = ["core", "competencies", "outcomes", "talents"] } = body;

    if (!segments || segments.length < 2) {
      return NextResponse.json(
        { error: "Se requieren al menos 2 segmentos para comparar" },
        { status: 400 }
      );
    }

    // Validate all segments have benchmarkId
    const validSegments = segments.filter((s) => s.benchmarkId);
    if (validSegments.length < 2) {
      return NextResponse.json(
        { error: "Cada segmento debe tener un benchmark seleccionado" },
        { status: 400 }
      );
    }

    // Get metrics to compare based on selected groups
    const metricsToCompare: string[] = [];
    for (const group of metricGroups) {
      if (METRIC_GROUPS[group]) {
        metricsToCompare.push(...METRIC_GROUPS[group]);
      }
    }

    // Get benchmark info for each segment
    const benchmarkIds = [...new Set(segments.map((s) => s.benchmarkId))];
    const benchmarks = await prisma.benchmark.findMany({
      where: { id: { in: benchmarkIds } },
      select: {
        id: true,
        name: true,
        type: true,
        scope: true,
      },
    });
    const benchmarkMap = new Map(benchmarks.map((b) => [b.id, b]));

    // Calculate stats for each segment
    const segmentResults = await Promise.all(
      segments.map(async (segment) => {
        const stats = await calculateSegmentStats(segment.benchmarkId, segment, metricsToCompare);
        const benchmark = benchmarkMap.get(segment.benchmarkId);

        // Get sample size from first available metric
        const firstStat = Object.values(stats)[0] as any;
        const sampleSize = firstStat?.n || 0;

        // Get top competencies
        const competencyStats = METRIC_GROUPS.competencies
          .map((key) => ({ key, mean: (stats[key] as any)?.mean || 0 }))
          .filter((c) => c.mean > 0)
          .sort((a, b) => b.mean - a.mean)
          .slice(0, 3);

        return {
          name: segment.name,
          benchmarkName: benchmark?.name || "Unknown",
          benchmarkId: segment.benchmarkId,
          filters: segment,
          sampleSize,
          avgK: (stats["K"] as any)?.mean,
          avgC: (stats["C"] as any)?.mean,
          avgG: (stats["G"] as any)?.mean,
          topCompetencies: competencyStats,
          stats,
        };
      })
    );

    // Build comparison matrix
    const statsMatrix: Record<string, Record<string, any>> = {};
    for (const metric of metricsToCompare) {
      statsMatrix[metric] = {};
      for (const result of segmentResults) {
        if (result.stats[metric]) {
          statsMatrix[metric][result.name] = result.stats[metric];
        }
      }
    }

    // Calculate differences (first segment as base)
    const differences: Record<string, Record<string, any>> = {};
    const baseSegment = segmentResults[0];

    for (const metric of metricsToCompare) {
      const baseStats = baseSegment.stats[metric];
      if (!baseStats) continue;

      differences[metric] = {};
      for (const otherResult of segmentResults.slice(1)) {
        const otherStats = otherResult.stats[metric];
        if (otherStats && baseStats.mean !== 0) {
          differences[metric][otherResult.name] = {
            meanDiff: otherStats.mean - baseStats.mean,
            meanDiffPercent: ((otherStats.mean - baseStats.mean) / baseStats.mean) * 100,
            medianDiff: otherStats.median - baseStats.median,
          };
        }
      }
    }

    // Identify significant differences
    const significantDifferences = Object.entries(differences)
      .map(([metric, diffs]) => {
        const avgDiff = Object.values(diffs)
          .reduce((sum: number, d: any) => sum + Math.abs(d.meanDiffPercent || 0), 0) /
          (segments.length - 1);
        return { metric, avgAbsDiffPercent: avgDiff };
      })
      .sort((a, b) => b.avgAbsDiffPercent - a.avgAbsDiffPercent)
      .slice(0, 10);

    return NextResponse.json({
      ok: true,
      segments: segmentResults.map((r) => ({
        name: r.name,
        benchmarkName: r.benchmarkName,
        benchmarkId: r.benchmarkId,
        filters: r.filters,
        sampleSize: r.sampleSize,
        avgK: r.avgK,
        avgC: r.avgC,
        avgG: r.avgG,
        topCompetencies: r.topCompetencies,
      })),
      comparison: {
        statistics: statsMatrix,
        differences,
        significantDifferences,
      },
      metadata: {
        metricsCompared: metricsToCompare.length,
        metricGroups,
        baseSegmentName: baseSegment.name,
      },
    });
  } catch (error) {
    console.error("❌ Error comparing cross-benchmark segments:", error);
    return NextResponse.json(
      { error: "Error al comparar segmentos" },
      { status: 500 }
    );
  }
}
