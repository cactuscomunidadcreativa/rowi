/**
 * 📊 API: Top Performers
 * GET /api/admin/benchmarks/[id]/top-performers - Top performers por outcome
 * Devuelve datos pre-calculados con todas las métricas estadísticas
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Constantes de configuración
const CONFIDENCE_HIGH = 385;
const CONFIDENCE_MEDIUM = 100;

function getConfidenceLevel(n: number): "high" | "medium" | "low" {
  if (n >= CONFIDENCE_HIGH) return "high";
  if (n >= CONFIDENCE_MEDIUM) return "medium";
  return "low";
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const headerEmail = req.headers.get("x-user-email");

    if (!session?.user?.email && !headerEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);

    // Filtros opcionales
    const outcomeKey = searchParams.get("outcomeKey");
    const country = searchParams.get("country");
    const region = searchParams.get("region");
    const sector = searchParams.get("sector");
    const jobRole = searchParams.get("jobRole");
    const tenantId = searchParams.get("tenantId");

    // Construir filtros
    const where: any = { benchmarkId: id };
    if (outcomeKey) where.outcomeKey = outcomeKey;
    if (country) where.country = country;
    if (region) where.region = region;
    if (sector) where.sector = sector;
    if (jobRole) where.jobRole = jobRole;
    if (tenantId) where.tenantId = tenantId;

    const topPerformersRaw = await prisma.benchmarkTopPerformer.findMany({
      where,
      orderBy: { outcomeKey: "asc" },
    });

    // Si se solicita un outcome específico pero no hay datos con esos filtros,
    // intentar fallback
    if (outcomeKey && topPerformersRaw.length === 0) {
      const fallbackData = await prisma.benchmarkTopPerformer.findFirst({
        where: {
          benchmarkId: id,
          outcomeKey,
          country: null,
          region: null,
          sector: null,
        },
      });

      if (fallbackData) {
        const totalPopulation = await prisma.benchmarkDataPoint.count({
          where: { benchmarkId: id, [outcomeKey]: { not: null } },
        });

        const enrichedFallback = enrichTopPerformer(fallbackData, totalPopulation);

        return NextResponse.json({
          ok: true,
          topPerformers: [enrichedFallback],
          fallbackUsed: "global",
          total: 1,
        });
      }
    }

    // Enriquecer los datos pre-calculados
    const topPerformers = await Promise.all(
      topPerformersRaw.map(async (tp) => {
        const totalPopulation = await prisma.benchmarkDataPoint.count({
          where: { benchmarkId: id, [tp.outcomeKey]: { not: null } },
        });

        return enrichTopPerformer(tp, totalPopulation);
      })
    );

    return NextResponse.json({
      ok: true,
      topPerformers,
      total: topPerformers.length,
    });
  } catch (error) {
    console.error("❌ Error fetching top performers:", error);
    return NextResponse.json(
      { error: "Error al obtener top performers" },
      { status: 500 }
    );
  }
}

/**
 * Enriquece un top performer con datos parseados y estadísticas
 */
function enrichTopPerformer(tp: any, totalPopulation: number) {
  // Parsear JSON fields si es necesario
  let topCompetencies = parseJsonField(tp.topCompetencies);
  let topTalents = parseJsonField(tp.topTalents);
  let topTalentsSummary = parseJsonField(tp.topTalentsSummary);
  let commonPatterns = parseJsonField(tp.commonPatterns);
  let talentPatterns = parseJsonField(tp.talentPatterns);
  let statistics = parseJsonField(tp.statistics);

  // Calcular nivel de confianza
  const confidenceLevel = tp.confidenceLevel || getConfidenceLevel(tp.sampleSize);

  // Si hay statistics guardados, usarlos directamente
  if (statistics && typeof statistics === 'object') {
    // Ya tenemos las estadísticas completas del /generate endpoint
    return {
      ...tp,
      topCompetencies,
      topTalents,
      topTalentsSummary,
      commonPatterns,
      talentPatterns,
      totalPopulation,
      confidenceLevel,
      thresholdValue: tp.thresholdValue || null,
      statistics: {
        globalMeans: statistics.globalMeans || {},
        significantCompetencies: statistics.significantCompetencies || 0,
        significantTalents: statistics.significantTalents || 0,
        avgEffectSizeCompetencies: roundTo2(statistics.avgEffectSizeCompetencies || 0),
        avgEffectSizeTalents: roundTo2(statistics.avgEffectSizeTalents || 0),
      },
    };
  }

  // Fallback: calcular estadísticas desde los datos disponibles
  const significantCompetencies = Array.isArray(topCompetencies)
    ? topCompetencies.filter((c: any) => c.isSignificant === true || (c.effectSize && Math.abs(c.effectSize) >= 0.5)).length
    : 0;

  const significantTalents = Array.isArray(topTalents)
    ? topTalents.filter((t: any) => t.isSignificant === true || (t.effectSize && Math.abs(t.effectSize) >= 0.5)).length
    : 0;

  const avgEffectSizeCompetencies = Array.isArray(topCompetencies) && topCompetencies.length > 0
    ? topCompetencies.reduce((acc: number, c: any) => acc + Math.abs(c.effectSize || 0), 0) / topCompetencies.length
    : 0;

  const avgEffectSizeTalents = Array.isArray(topTalents) && topTalents.length > 0
    ? topTalents.reduce((acc: number, t: any) => acc + Math.abs(t.effectSize || 0), 0) / topTalents.length
    : 0;

  return {
    ...tp,
    topCompetencies,
    topTalents,
    topTalentsSummary,
    commonPatterns,
    talentPatterns,
    totalPopulation,
    confidenceLevel,
    thresholdValue: tp.thresholdValue || null,
    statistics: {
      significantCompetencies,
      significantTalents,
      avgEffectSizeCompetencies: roundTo2(avgEffectSizeCompetencies),
      avgEffectSizeTalents: roundTo2(avgEffectSizeTalents),
    },
  };
}

function parseJsonField(field: any): any {
  if (field === null || field === undefined) return [];
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return [];
    }
  }
  return field;
}

function roundTo2(num: number): number {
  return Math.round(num * 100) / 100;
}
