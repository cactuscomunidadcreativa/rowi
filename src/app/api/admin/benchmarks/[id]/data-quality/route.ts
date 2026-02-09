/**
 * 📊 API: Benchmark Data Quality Analysis
 * GET /api/admin/benchmarks/[id]/data-quality
 * Analiza calidad: completeness, duplicados, outliers, reliability
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const REQUIRED_FIELDS = [
  "eqTotal", "K", "C", "G",
  "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG",
  "effectiveness", "relationships", "wellbeing", "qualityOfLife",
  "country", "region", "jobRole", "jobFunction", "brainStyle",
  "ageRange", "gender", "sector", "reliabilityIndex", "sourceId",
];

const NUMERIC_FIELDS = [
  "eqTotal", "K", "C", "G",
  "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG",
  "effectiveness", "relationships", "wellbeing", "qualityOfLife",
];

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const headerEmail = req.headers.get("x-user-email");

    if (!session?.user?.email && !headerEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Total records
    const totalRecords = await prisma.benchmarkDataPoint.count({
      where: { benchmarkId: id },
    });

    if (totalRecords === 0) {
      return NextResponse.json({ ok: true, totalRecords: 0, qualityScore: 0, completeness: [], duplicates: [], outliers: [], reliabilityDistribution: [] });
    }

    // 1. Completeness: por cada campo, cuántos tienen valor
    const completeness = [];
    for (const field of REQUIRED_FIELDS) {
      const count = await prisma.benchmarkDataPoint.count({
        where: { benchmarkId: id, [field]: { not: null } },
      });
      completeness.push({
        field,
        present: count,
        missing: totalRecords - count,
        percentage: Math.round((count / totalRecords) * 10000) / 100,
      });
    }

    // 2. Duplicates: sourceIds que aparecen más de una vez
    const duplicateGroups = await prisma.benchmarkDataPoint.groupBy({
      by: ["sourceId"],
      where: { benchmarkId: id, sourceId: { not: null } },
      _count: { sourceId: true },
      having: { sourceId: { _count: { gt: 1 } } },
      orderBy: { _count: { sourceId: "desc" } },
      take: 20,
    });

    const duplicates = [];
    for (const dup of duplicateGroups) {
      if (!dup.sourceId) continue;
      const records = await prisma.benchmarkDataPoint.findMany({
        where: { benchmarkId: id, sourceId: dup.sourceId },
        select: {
          id: true, sourceId: true, sourceDate: true,
          country: true, region: true, jobRole: true,
          eqTotal: true, brainStyle: true,
        },
        orderBy: { sourceDate: "asc" },
      });
      duplicates.push({
        sourceId: dup.sourceId,
        count: dup._count.sourceId,
        records,
      });
    }

    const totalDuplicateRecords = duplicateGroups.reduce((sum, d) => sum + d._count.sourceId, 0);

    // 3. Reliability Index Distribution
    const reliabilityData = await prisma.benchmarkDataPoint.findMany({
      where: { benchmarkId: id, reliabilityIndex: { not: null } },
      select: { reliabilityIndex: true },
    });

    const reliabilityValues = reliabilityData
      .map((d) => d.reliabilityIndex!)
      .sort((a, b) => a - b);

    const reliabilityDistribution = {
      count: reliabilityValues.length,
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      buckets: [] as { range: string; count: number }[],
    };

    if (reliabilityValues.length > 0) {
      const sum = reliabilityValues.reduce((a, b) => a + b, 0);
      reliabilityDistribution.mean = Math.round((sum / reliabilityValues.length) * 100) / 100;
      reliabilityDistribution.median = reliabilityValues[Math.floor(reliabilityValues.length / 2)];
      reliabilityDistribution.min = reliabilityValues[0];
      reliabilityDistribution.max = reliabilityValues[reliabilityValues.length - 1];

      // Buckets
      const bucketRanges = [
        { range: "0-20", min: 0, max: 20 },
        { range: "20-40", min: 20, max: 40 },
        { range: "40-60", min: 40, max: 60 },
        { range: "60-80", min: 60, max: 80 },
        { range: "80-100", min: 80, max: 101 },
      ];

      for (const bucket of bucketRanges) {
        reliabilityDistribution.buckets.push({
          range: bucket.range,
          count: reliabilityValues.filter(v => v >= bucket.min && v < bucket.max).length,
        });
      }
    }

    // 4. Outliers: records where eqTotal is > 2 stddev from mean
    const eqData = await prisma.benchmarkDataPoint.findMany({
      where: { benchmarkId: id, eqTotal: { not: null } },
      select: { eqTotal: true },
    });

    const eqValues = eqData.map(d => d.eqTotal!);
    const eqMean = eqValues.reduce((a, b) => a + b, 0) / eqValues.length;
    const eqVariance = eqValues.reduce((acc, val) => acc + Math.pow(val - eqMean, 2), 0) / eqValues.length;
    const eqStdDev = Math.sqrt(eqVariance);
    const outlierThresholdHigh = eqMean + 2 * eqStdDev;
    const outlierThresholdLow = eqMean - 2 * eqStdDev;

    const outlierRecords = await prisma.benchmarkDataPoint.findMany({
      where: {
        benchmarkId: id,
        OR: [
          { eqTotal: { gt: outlierThresholdHigh } },
          { eqTotal: { lt: outlierThresholdLow } },
        ],
      },
      select: {
        id: true, sourceId: true, country: true, region: true,
        jobRole: true, eqTotal: true, brainStyle: true, reliabilityIndex: true,
      },
      orderBy: { eqTotal: "desc" },
      take: 30,
    });

    const outliers = outlierRecords.map(o => ({
      ...o,
      zScore: Math.round(((o.eqTotal! - eqMean) / eqStdDev) * 100) / 100,
      type: o.eqTotal! > eqMean ? "high" : "low",
    }));

    // 5. Quality Score (0-100)
    const avgCompleteness = completeness.reduce((sum, c) => sum + c.percentage, 0) / completeness.length;
    const duplicatesPenalty = Math.min((totalDuplicateRecords / totalRecords) * 100, 20);
    const outliersPenalty = Math.min((outliers.length / totalRecords) * 200, 15);
    const reliabilityBonus = reliabilityDistribution.mean > 0 ? (reliabilityDistribution.mean / 100) * 15 : 0;
    const qualityScore = Math.round(Math.max(0, Math.min(100,
      avgCompleteness * 0.7 + reliabilityBonus - duplicatesPenalty - outliersPenalty
    )) * 10) / 10;

    return NextResponse.json({
      ok: true,
      totalRecords,
      qualityScore,
      completeness,
      duplicates,
      totalDuplicateGroups: duplicateGroups.length,
      totalDuplicateRecords,
      outliers,
      outlierStats: {
        mean: Math.round(eqMean * 100) / 100,
        stdDev: Math.round(eqStdDev * 100) / 100,
        thresholdHigh: Math.round(outlierThresholdHigh * 100) / 100,
        thresholdLow: Math.round(outlierThresholdLow * 100) / 100,
        totalOutliers: outliers.length,
      },
      reliabilityDistribution,
    });
  } catch (error) {
    console.error("❌ Error analyzing data quality:", error);
    return NextResponse.json(
      { error: "Error al analizar calidad de datos" },
      { status: 500 }
    );
  }
}
