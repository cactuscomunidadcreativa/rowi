/**
 * 📊 API: Compare Segments within a Benchmark
 * POST /api/admin/benchmarks/[id]/compare-segments
 * Compara segmentos dentro del mismo benchmark (ej: Latin America vs North America)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";
import { COLUMN_MAPPING } from "@/lib/benchmarks/column-mapping";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface SegmentFilter {
  name: string;
  country?: string;
  region?: string;
  sector?: string;
  jobFunction?: string;
  jobRole?: string;
  ageRange?: string;
  gender?: string;
  education?: string;
  year?: string;
}

interface CompareSegmentsRequest {
  segments: SegmentFilter[];
  metrics?: string[];
}

// Metricas disponibles
const CORE_METRICS = ["K", "C", "G"];
const COMPETENCIES = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];
const OUTCOMES = [
  "effectiveness", "relationships", "qualityOfLife", "wellbeing",
  "influence", "decisionMaking", "community", "network",
  "achievement", "satisfaction", "balance", "health",
];
const TALENTS = [
  "dataMining", "modeling", "prioritizing", "connection", "emotionalInsight", "collaboration",
  "reflecting", "adaptability", "criticalThinking", "resilience", "riskTolerance", "imagination",
  "proactivity", "commitment", "problemSolving", "vision", "designing", "entrepreneurship",
];

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body: CompareSegmentsRequest = await req.json();
    const { segments, metrics } = body;

    if (!segments || segments.length < 2) {
      return NextResponse.json(
        { error: "Se requieren al menos 2 segmentos para comparar" },
        { status: 400 }
      );
    }

    // Verificar que el benchmark existe
    const benchmark = await prisma.benchmark.findUnique({
      where: { id },
      select: { id: true, name: true, totalRows: true },
    });

    if (!benchmark) {
      return NextResponse.json({ error: "Benchmark no encontrado" }, { status: 404 });
    }

    // Metricas a comparar (incluir todas por defecto)
    const metricsToCompare = metrics || [...CORE_METRICS, ...COMPETENCIES, ...OUTCOMES, ...TALENTS];

    // Calcular estadisticas para cada segmento
    const segmentResults = await Promise.all(
      segments.map(async (segment) => {
        const stats = await calculateSegmentStats(id, segment, metricsToCompare);
        return {
          segment,
          stats,
        };
      })
    );

    // Construir matriz de comparacion
    const statsMatrix: Record<string, Record<string, any>> = {};

    for (const metric of metricsToCompare) {
      statsMatrix[metric] = {};
      for (const { segment, stats } of segmentResults) {
        const stat = stats.find((s) => s.metricKey === metric);
        if (stat) {
          statsMatrix[metric][segment.name] = {
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

    // Calcular diferencias (primer segmento como base)
    const differences: Record<string, Record<string, any>> = {};
    const baseSegmentName = segments[0].name;

    for (const metric of metricsToCompare) {
      const baseStats = statsMatrix[metric]?.[baseSegmentName];
      if (!baseStats || !baseStats.mean) continue;

      differences[metric] = {};
      for (const otherSegment of segments.slice(1)) {
        const otherStats = statsMatrix[metric]?.[otherSegment.name];
        if (otherStats && otherStats.mean) {
          const meanDiff = otherStats.mean - baseStats.mean;
          differences[metric][otherSegment.name] = {
            meanDiff,
            meanDiffPercent: (meanDiff / baseStats.mean) * 100,
            medianDiff: (otherStats.median || 0) - (baseStats.median || 0),
          };
        }
      }
    }

    // Identificar diferencias significativas
    const significantDifferences = Object.entries(differences)
      .map(([metric, diffs]) => {
        const avgDiff = Object.values(diffs)
          .reduce((sum: number, d: any) => sum + Math.abs(d.meanDiffPercent || 0), 0) /
          (segments.length - 1);
        return { metric, avgAbsDiffPercent: avgDiff };
      })
      .filter((d) => d.avgAbsDiffPercent > 0)
      .sort((a, b) => b.avgAbsDiffPercent - a.avgAbsDiffPercent)
      .slice(0, 10);

    // Resumen por segmento
    const segmentSummaries = segmentResults.map(({ segment, stats }) => {
      const totalN = stats[0]?.n || 0;
      const coreMetrics = stats.filter((s) => CORE_METRICS.includes(s.metricKey));
      const competencyMetrics = stats.filter((s) => COMPETENCIES.includes(s.metricKey));

      return {
        name: segment.name,
        filters: segment,
        sampleSize: totalN,
        avgK: coreMetrics.find((s) => s.metricKey === "K")?.mean,
        avgC: coreMetrics.find((s) => s.metricKey === "C")?.mean,
        avgG: coreMetrics.find((s) => s.metricKey === "G")?.mean,
        topCompetencies: competencyMetrics
          .filter((s) => s.mean !== null)
          .sort((a, b) => (b.mean || 0) - (a.mean || 0))
          .slice(0, 3)
          .map((s) => ({ key: s.metricKey, mean: s.mean })),
      };
    });

    return NextResponse.json({
      ok: true,
      benchmark: {
        id: benchmark.id,
        name: benchmark.name,
        totalRows: benchmark.totalRows,
      },
      segments: segmentSummaries,
      comparison: {
        statistics: statsMatrix,
        differences,
        significantDifferences,
      },
      metadata: {
        metricsCompared: metricsToCompare.length,
        baseSegment: baseSegmentName,
        comparedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error comparing segments:", error);
    return NextResponse.json(
      { error: "Error al comparar segmentos" },
      { status: 500 }
    );
  }
}

async function calculateSegmentStats(
  benchmarkId: string,
  segment: SegmentFilter,
  metrics: string[]
): Promise<Array<{ metricKey: string; n: number; mean: number | null; median: number | null; stdDev: number | null; p10: number | null; p25: number | null; p75: number | null; p90: number | null }>> {
  // Construir filtro WHERE
  const where: any = { benchmarkId };

  if (segment.country) where.country = segment.country;
  if (segment.region) where.region = segment.region;
  if (segment.sector) where.sector = segment.sector;
  if (segment.jobFunction) where.jobFunction = segment.jobFunction;
  if (segment.jobRole) where.jobRole = segment.jobRole;
  if (segment.gender) where.gender = segment.gender;
  if (segment.education) where.education = segment.education;

  // Filtro de edad por rango (ej: "25-29" busca edades que contengan números en ese rango)
  if (segment.ageRange) {
    const ageMatch = segment.ageRange.match(/(\d+)-(\d+)/);
    if (ageMatch) {
      const minAge = parseInt(ageMatch[1], 10);
      const maxAge = parseInt(ageMatch[2], 10);
      // Buscar ageRanges que contengan valores dentro del rango
      where.OR = [];
      for (let age = minAge; age <= maxAge; age++) {
        where.OR.push({ ageRange: { contains: String(age) } });
      }
    } else {
      where.ageRange = segment.ageRange;
    }
  }

  // Filtro de año basado en sourceDate
  if (segment.year) {
    const year = parseInt(segment.year, 10);
    where.sourceDate = {
      gte: new Date(`${year}-01-01`),
      lt: new Date(`${year + 1}-01-01`),
    };
  }

  // Obtener datos del segmento
  const data = await prisma.benchmarkDataPoint.findMany({
    where,
    select: {
      // Core EQ
      K: true, C: true, G: true,
      // Competencies
      EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true,
      // Outcomes
      effectiveness: true, relationships: true, qualityOfLife: true, wellbeing: true,
      influence: true, decisionMaking: true, community: true, network: true,
      achievement: true, satisfaction: true, balance: true, health: true,
      // Talents
      dataMining: true, modeling: true, prioritizing: true, connection: true,
      emotionalInsight: true, collaboration: true, reflecting: true, adaptability: true,
      criticalThinking: true, resilience: true, riskTolerance: true, imagination: true,
      proactivity: true, commitment: true, problemSolving: true, vision: true,
      designing: true, entrepreneurship: true,
    },
  });

  const results = [];

  for (const metric of metrics) {
    const values = data
      .map((d) => (d as any)[metric])
      .filter((v) => v !== null && v !== undefined && !isNaN(v)) as number[];

    if (values.length === 0) {
      results.push({
        metricKey: metric,
        n: 0,
        mean: null,
        median: null,
        stdDev: null,
        p10: null,
        p25: null,
        p75: null,
        p90: null,
      });
      continue;
    }

    values.sort((a, b) => a - b);
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const median = n % 2 === 0
      ? (values[n / 2 - 1] + values[n / 2]) / 2
      : values[Math.floor(n / 2)];

    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const percentile = (p: number) => {
      const idx = (p / 100) * (n - 1);
      const lower = Math.floor(idx);
      const upper = Math.ceil(idx);
      if (lower === upper) return values[lower];
      return values[lower] + (values[upper] - values[lower]) * (idx - lower);
    };

    results.push({
      metricKey: metric,
      n,
      mean,
      median,
      stdDev,
      p10: percentile(10),
      p25: percentile(25),
      p75: percentile(75),
      p90: percentile(90),
    });
  }

  return results;
}
