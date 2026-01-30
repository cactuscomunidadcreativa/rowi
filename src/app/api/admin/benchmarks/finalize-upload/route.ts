/**
 * 📊 API: Finalize Benchmark Upload
 * POST /api/admin/benchmarks/finalize-upload
 *
 * Calcula estadísticas, correlaciones y top performers
 * después de que todos los chunks han sido subidos.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";
import { EQ_COMPETENCIES, OUTCOMES, BRAIN_TALENTS, calculateStats } from "@/lib/benchmarks";

interface FinalizeBody {
  benchmarkId: string;
  jobId: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: FinalizeBody = await req.json();
    const { benchmarkId, jobId } = body;

    if (!benchmarkId || !jobId) {
      return NextResponse.json(
        { error: "benchmarkId and jobId are required" },
        { status: 400 }
      );
    }

    // Verificar benchmark existe
    const benchmark = await prisma.benchmark.findUnique({
      where: { id: benchmarkId },
    });

    if (!benchmark) {
      return NextResponse.json({ error: "Benchmark not found" }, { status: 404 });
    }

    // Contar total de filas insertadas
    const totalInserted = await prisma.benchmarkDataPoint.count({
      where: { benchmarkId },
    });

    console.log(`📊 Finalizing benchmark ${benchmarkId} with ${totalInserted} rows`);

    if (totalInserted === 0) {
      await prisma.benchmark.update({
        where: { id: benchmarkId },
        data: { status: "FAILED" },
      });
      await prisma.benchmarkUploadJob.update({
        where: { id: jobId },
        data: {
          status: "failed",
          errorMessage: "No valid rows were imported",
          completedAt: new Date(),
        },
      });
      return NextResponse.json(
        { error: "No valid rows were imported" },
        { status: 400 }
      );
    }

    // Fase 1: Estadísticas (70-80%)
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: { progress: 72, currentPhase: "statistics" },
    });
    await calculateAndSaveStatistics(benchmarkId);

    // Fase 2: Correlaciones (80-90%)
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: { progress: 82, currentPhase: "correlations" },
    });
    await calculateAndSaveCorrelations(benchmarkId);

    // Fase 3: Top Performers (90-98%)
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: { progress: 92, currentPhase: "topPerformers" },
    });
    await calculateAndSaveTopPerformers(benchmarkId);

    // Finalizar
    await prisma.benchmark.update({
      where: { id: benchmarkId },
      data: {
        status: "COMPLETED",
        totalRows: totalInserted,
        processedRows: totalInserted,
        processedAt: new Date(),
      },
    });

    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        progress: 100,
        currentPhase: null,
        processedRows: totalInserted,
        totalRows: totalInserted,
        completedAt: new Date(),
      },
    });

    console.log(`✅ Benchmark ${benchmarkId} finalized: ${totalInserted} rows`);

    return NextResponse.json({
      ok: true,
      benchmarkId,
      totalRows: totalInserted,
      message: "Benchmark processing completed",
    });
  } catch (error) {
    console.error("❌ Error finalizing benchmark:", error);

    // Intentar marcar como fallido
    try {
      const body = await req.clone().json();
      if (body.benchmarkId) {
        await prisma.benchmark.update({
          where: { id: body.benchmarkId },
          data: { status: "FAILED" },
        });
      }
      if (body.jobId) {
        await prisma.benchmarkUploadJob.update({
          where: { id: body.jobId },
          data: {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            completedAt: new Date(),
          },
        });
      }
    } catch {}

    return NextResponse.json(
      {
        error: "Error finalizing benchmark",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// =========================================================
// 📊 CÁLCULO DE ESTADÍSTICAS
// =========================================================
async function calculateAndSaveStatistics(benchmarkId: string) {
  const metricsToCalculate = [
    "K", "C", "G", "eqTotal",
    "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG",
    "effectiveness", "relationships", "qualityOfLife", "wellbeing",
    "influence", "decisionMaking", "community", "network",
    "achievement", "satisfaction", "balance", "health",
  ];

  const statsToCreate = [];

  for (const metric of metricsToCalculate) {
    const aggregations = await prisma.benchmarkDataPoint.aggregate({
      where: {
        benchmarkId,
        [metric]: { not: null },
      },
      _count: { [metric]: true },
      _avg: { [metric]: true },
      _min: { [metric]: true },
      _max: { [metric]: true },
    });

    const count = (aggregations._count as any)[metric] || 0;

    if (count >= 30) {
      const sampleSize = Math.min(count, 50000);

      const rawValues = await prisma.benchmarkDataPoint.findMany({
        where: {
          benchmarkId,
          [metric]: { not: null },
        },
        select: { [metric]: true },
        take: sampleSize,
        orderBy: { [metric]: "asc" },
      });

      const values = rawValues.map((r: any) => r[metric] as number).filter((v: number) => v !== null);

      if (values.length >= 30) {
        const stats = calculateStats(values);
        statsToCreate.push({
          benchmarkId,
          metricKey: metric,
          n: count,
          mean: (aggregations._avg as any)[metric],
          median: stats.median,
          stdDev: stats.stdDev,
          min: (aggregations._min as any)[metric],
          max: (aggregations._max as any)[metric],
          p10: stats.p10,
          p25: stats.p25,
          p50: stats.p50,
          p75: stats.p75,
          p90: stats.p90,
          p95: stats.p95,
        });
      }
    }
  }

  if (statsToCreate.length > 0) {
    await prisma.benchmarkStatistic.createMany({ data: statsToCreate });
  }

  console.log(`📊 Statistics calculated: ${statsToCreate.length} metrics`);
}

// =========================================================
// 🔗 CÁLCULO DE CORRELACIONES
// =========================================================
async function calculateAndSaveCorrelations(benchmarkId: string) {
  const CHUNK_SIZE = 10000;
  let offset = 0;
  let hasMore = true;

  type PairStats = {
    n: number;
    sumX: number;
    sumY: number;
    sumXY: number;
    sumX2: number;
    sumY2: number;
  };

  const pairAccumulators: Record<string, PairStats> = {};

  for (const comp of EQ_COMPETENCIES) {
    for (const out of OUTCOMES) {
      pairAccumulators[`${comp}_${out}`] = {
        n: 0, sumX: 0, sumY: 0, sumXY: 0, sumX2: 0, sumY2: 0,
      };
    }
  }

  while (hasMore) {
    const chunk = await prisma.benchmarkDataPoint.findMany({
      where: { benchmarkId },
      select: {
        K: true, C: true, G: true,
        EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true,
        effectiveness: true, relationships: true, qualityOfLife: true, wellbeing: true,
        influence: true, decisionMaking: true, community: true, network: true,
        achievement: true, satisfaction: true, balance: true, health: true,
      },
      skip: offset,
      take: CHUNK_SIZE,
    });

    if (chunk.length === 0) {
      hasMore = false;
      break;
    }

    for (const dp of chunk) {
      for (const comp of EQ_COMPETENCIES) {
        const compVal = (dp as any)[comp];
        if (compVal === null || compVal === undefined) continue;

        for (const out of OUTCOMES) {
          const outVal = (dp as any)[out];
          if (outVal === null || outVal === undefined) continue;

          const key = `${comp}_${out}`;
          const acc = pairAccumulators[key];
          acc.n++;
          acc.sumX += compVal;
          acc.sumY += outVal;
          acc.sumXY += compVal * outVal;
          acc.sumX2 += compVal * compVal;
          acc.sumY2 += outVal * outVal;
        }
      }
    }

    offset += chunk.length;
    if (chunk.length < CHUNK_SIZE) hasMore = false;
  }

  const correlationsToCreate = [];

  for (const comp of EQ_COMPETENCIES) {
    for (const out of OUTCOMES) {
      const key = `${comp}_${out}`;
      const acc = pairAccumulators[key];

      if (acc.n >= 30) {
        const numerator = acc.n * acc.sumXY - acc.sumX * acc.sumY;
        const denomX = acc.n * acc.sumX2 - acc.sumX * acc.sumX;
        const denomY = acc.n * acc.sumY2 - acc.sumY * acc.sumY;
        const denominator = Math.sqrt(denomX * denomY);

        if (denominator > 0) {
          const correlation = numerator / denominator;
          const tStat = correlation * Math.sqrt((acc.n - 2) / (1 - correlation * correlation));
          const pValue = acc.n > 100 ? 2 * (1 - normalCDF(Math.abs(tStat))) : 0.001;

          const absR = Math.abs(correlation);
          let strength: string;
          if (absR < 0.1) strength = "none";
          else if (absR < 0.3) strength = "weak";
          else if (absR < 0.5) strength = "moderate";
          else if (absR < 0.7) strength = "strong";
          else strength = "very_strong";

          correlationsToCreate.push({
            benchmarkId,
            competencyKey: comp,
            outcomeKey: out,
            correlation,
            pValue,
            n: acc.n,
            strength,
            direction: correlation > 0 ? "positive" : "negative",
          });
        }
      }
    }
  }

  if (correlationsToCreate.length > 0) {
    await prisma.benchmarkCorrelation.createMany({ data: correlationsToCreate });
  }

  console.log(`🔗 Correlations calculated: ${correlationsToCreate.length}`);
}

function normalCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

// =========================================================
// 🏆 CÁLCULO DE TOP PERFORMERS
// =========================================================
async function calculateAndSaveTopPerformers(benchmarkId: string) {
  const CHUNK_SIZE = 10000;
  const PERCENTILE_THRESHOLD = 90;
  const topPerformersToCreate = [];

  for (const outcome of OUTCOMES) {
    const count = await prisma.benchmarkDataPoint.count({
      where: { benchmarkId, [outcome]: { not: null } },
    });

    if (count < 30) continue;

    const p90Index = Math.floor(count * 0.9);
    const threshold = await prisma.benchmarkDataPoint.findFirst({
      where: { benchmarkId, [outcome]: { not: null } },
      orderBy: { [outcome]: "asc" },
      skip: p90Index,
      select: { [outcome]: true },
    });

    if (!threshold || (threshold as any)[outcome] === null) continue;

    const thresholdValue = (threshold as any)[outcome];

    // Calcular promedios de competencias para top performers
    const aggregations = await prisma.benchmarkDataPoint.aggregate({
      where: { benchmarkId, [outcome]: { gte: thresholdValue } },
      _avg: {
        K: true, C: true, G: true,
        EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true,
      },
      _count: { _all: true },
    });

    const sampleSize = aggregations._count._all;
    if (sampleSize < 30) continue;

    topPerformersToCreate.push({
      benchmarkId,
      outcomeKey: outcome,
      percentileThreshold: PERCENTILE_THRESHOLD,
      sampleSize,
      avgK: aggregations._avg.K,
      avgC: aggregations._avg.C,
      avgG: aggregations._avg.G,
      avgEL: aggregations._avg.EL,
      avgRP: aggregations._avg.RP,
      avgACT: aggregations._avg.ACT,
      avgNE: aggregations._avg.NE,
      avgIM: aggregations._avg.IM,
      avgOP: aggregations._avg.OP,
      avgEMP: aggregations._avg.EMP,
      avgNG: aggregations._avg.NG,
      topCompetencies: [],
      topTalents: [],
      commonPatterns: [],
    });
  }

  if (topPerformersToCreate.length > 0) {
    await prisma.benchmarkTopPerformer.createMany({ data: topPerformersToCreate });
  }

  console.log(`🏆 Top performers calculated: ${topPerformersToCreate.length} outcomes`);
}
