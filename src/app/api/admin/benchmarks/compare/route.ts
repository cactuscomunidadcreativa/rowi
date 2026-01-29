/**
 * 📊 API: Compare Benchmarks
 * POST /api/admin/benchmarks/compare - Comparar múltiples benchmarks
 * Permite comparar estadísticas y top performers entre diferentes benchmarks o segmentos
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

interface CompareRequest {
  benchmarkIds: string[];
  metrics?: string[];
  outcomes?: string[];
}

// Métricas disponibles
const CORE_METRICS = ["K", "C", "G", "eqTotal"];
const COMPETENCIES = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];
const OUTCOMES = [
  "effectiveness", "relationships", "qualityOfLife", "wellbeing",
  "influence", "decisionMaking", "community", "network",
  "achievement", "satisfaction", "balance", "health",
];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CompareRequest = await req.json();
    const { benchmarkIds, metrics, outcomes } = body;

    if (!benchmarkIds || benchmarkIds.length < 2) {
      return NextResponse.json(
        { error: "Se requieren al menos 2 benchmarks para comparar" },
        { status: 400 }
      );
    }

    // Obtener información básica de los benchmarks
    const benchmarks = await prisma.benchmark.findMany({
      where: { id: { in: benchmarkIds } },
      select: {
        id: true,
        name: true,
        type: true,
        scope: true,
        status: true,
        totalRows: true,
        createdAt: true,
      },
    });

    if (benchmarks.length !== benchmarkIds.length) {
      return NextResponse.json(
        { error: "Uno o más benchmarks no encontrados" },
        { status: 404 }
      );
    }

    // Determinar qué métricas comparar
    const metricsToCompare = metrics || [...CORE_METRICS, ...COMPETENCIES];
    const outcomesToCompare = outcomes || OUTCOMES;

    // Obtener estadísticas de cada benchmark
    const statsComparison = await Promise.all(
      benchmarkIds.map(async (benchmarkId) => {
        const stats = await prisma.benchmarkStatistic.findMany({
          where: {
            benchmarkId,
            metricKey: { in: metricsToCompare },
          },
        });
        return { benchmarkId, stats };
      })
    );

    // Obtener top performers de cada benchmark
    const topPerformersComparison = await Promise.all(
      benchmarkIds.map(async (benchmarkId) => {
        const topPerformers = await prisma.benchmarkTopPerformer.findMany({
          where: {
            benchmarkId,
            outcomeKey: { in: outcomesToCompare },
            country: null,
            region: null,
            sector: null,
          },
        });
        return { benchmarkId, topPerformers };
      })
    );

    // Construir matriz de comparación para estadísticas
    const statsMatrix: Record<string, Record<string, any>> = {};

    for (const metric of metricsToCompare) {
      statsMatrix[metric] = {};
      for (const { benchmarkId, stats } of statsComparison) {
        const stat = stats.find((s) => s.metricKey === metric);
        if (stat) {
          statsMatrix[metric][benchmarkId] = {
            n: stat.n,
            mean: stat.mean,
            median: stat.median,
            stdDev: stat.stdDev,
            p10: stat.p10,
            p25: stat.p25,
            p75: stat.p75,
            p90: stat.p90,
          };
        }
      }
    }

    // Construir matriz de comparación para top performers
    const topPerformersMatrix: Record<string, Record<string, any>> = {};

    for (const outcome of outcomesToCompare) {
      topPerformersMatrix[outcome] = {};
      for (const { benchmarkId, topPerformers } of topPerformersComparison) {
        const tp = topPerformers.find((t) => t.outcomeKey === outcome);
        if (tp) {
          let topCompetencies = tp.topCompetencies;
          let topTalents = tp.topTalents;

          if (typeof topCompetencies === "string") {
            try { topCompetencies = JSON.parse(topCompetencies); } catch { topCompetencies = []; }
          }
          if (typeof topTalents === "string") {
            try { topTalents = JSON.parse(topTalents); } catch { topTalents = []; }
          }

          topPerformersMatrix[outcome][benchmarkId] = {
            sampleSize: tp.sampleSize,
            percentileThreshold: tp.percentileThreshold,
            avgK: tp.avgK,
            avgC: tp.avgC,
            avgG: tp.avgG,
            topCompetencies: Array.isArray(topCompetencies) ? topCompetencies.slice(0, 5) : [],
            topTalents: Array.isArray(topTalents) ? topTalents.slice(0, 5) : [],
          };
        }
      }
    }

    // Calcular diferencias entre benchmarks (primero vs resto)
    const differences: Record<string, any> = {};
    const baseBenchmarkId = benchmarkIds[0];

    for (const metric of metricsToCompare) {
      const baseStats = statsMatrix[metric]?.[baseBenchmarkId];
      if (!baseStats) continue;

      differences[metric] = {};
      for (const otherId of benchmarkIds.slice(1)) {
        const otherStats = statsMatrix[metric]?.[otherId];
        if (otherStats) {
          differences[metric][otherId] = {
            meanDiff: otherStats.mean - baseStats.mean,
            meanDiffPercent: ((otherStats.mean - baseStats.mean) / baseStats.mean) * 100,
            medianDiff: otherStats.median - baseStats.median,
          };
        }
      }
    }

    // Identificar métricas con mayores diferencias
    const significantDifferences = Object.entries(differences)
      .map(([metric, diffs]) => {
        const avgDiff = Object.values(diffs as Record<string, any>)
          .reduce((sum: number, d: any) => sum + Math.abs(d.meanDiffPercent || 0), 0) /
          (benchmarkIds.length - 1);
        return { metric, avgAbsDiffPercent: avgDiff };
      })
      .sort((a, b) => b.avgAbsDiffPercent - a.avgAbsDiffPercent)
      .slice(0, 10);

    return NextResponse.json({
      ok: true,
      benchmarks: benchmarks.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
      })),
      comparison: {
        statistics: statsMatrix,
        topPerformers: topPerformersMatrix,
        differences,
        significantDifferences,
      },
      metadata: {
        metricsCompared: metricsToCompare.length,
        outcomesCompared: outcomesToCompare.length,
        baseBenchmarkId,
      },
    });
  } catch (error) {
    console.error("❌ Error comparing benchmarks:", error);
    return NextResponse.json(
      { error: "Error al comparar benchmarks" },
      { status: 500 }
    );
  }
}
