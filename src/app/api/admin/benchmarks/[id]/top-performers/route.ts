/**
 * 📊 API: Top Performers
 * GET /api/admin/benchmarks/[id]/top-performers - Top performers por outcome
 * Devuelve datos pre-calculados enriquecidos con métricas estadísticas
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Constantes de configuración (mismas que calculate)
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
    if (!session?.user?.email) {
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
        // Obtener población total para este outcome
        const totalPopulation = await prisma.benchmarkDataPoint.count({
          where: { benchmarkId: id, [outcomeKey]: { not: null } },
        });

        const enrichedFallback = {
          ...fallbackData,
          totalPopulation,
          confidenceLevel: getConfidenceLevel(fallbackData.sampleSize),
          thresholdValue: null,
          statistics: {
            significantCompetencies: 0,
            significantTalents: 0,
            avgEffectSizeCompetencies: 0,
            avgEffectSizeTalents: 0,
          },
        };

        return NextResponse.json({
          ok: true,
          topPerformers: [enrichedFallback],
          fallbackUsed: "global",
          total: 1,
        });
      }
    }

    // Enriquecer los datos pre-calculados con las nuevas métricas
    const topPerformers = await Promise.all(
      topPerformersRaw.map(async (tp) => {
        // Obtener población total para este outcome
        const totalPopulation = await prisma.benchmarkDataPoint.count({
          where: { benchmarkId: id, [tp.outcomeKey]: { not: null } },
        });

        // Calcular nivel de confianza basado en sample size
        const confidenceLevel = getConfidenceLevel(tp.sampleSize);

        // Parsear topCompetencies y topTalents si son JSON strings
        let topCompetencies = tp.topCompetencies;
        let topTalents = tp.topTalents;
        let topTalentsSummary = (tp as any).topTalentsSummary;

        if (typeof topCompetencies === "string") {
          try {
            topCompetencies = JSON.parse(topCompetencies);
          } catch {
            topCompetencies = [];
          }
        }
        if (typeof topTalents === "string") {
          try {
            topTalents = JSON.parse(topTalents);
          } catch {
            topTalents = [];
          }
        }
        if (typeof topTalentsSummary === "string") {
          try {
            topTalentsSummary = JSON.parse(topTalentsSummary);
          } catch {
            topTalentsSummary = [];
          }
        }

        // Contar competencias y talentos "significativos" (diffFromAvg > 3)
        const significantCompetencies = Array.isArray(topCompetencies)
          ? topCompetencies.filter((c: any) => c.diffFromAvg > 3).length
          : 0;
        const significantTalents = Array.isArray(topTalents)
          ? topTalents.filter((t: any) => t.diffFromAvg > 3).length
          : 0;

        // Calcular effect size promedio aproximado (diffFromAvg / 15 como proxy)
        const avgEffectSizeCompetencies = Array.isArray(topCompetencies) && topCompetencies.length > 0
          ? topCompetencies.reduce((acc: number, c: any) => acc + (c.diffFromAvg || 0), 0) / topCompetencies.length / 15
          : 0;
        const avgEffectSizeTalents = Array.isArray(topTalents) && topTalents.length > 0
          ? topTalents.reduce((acc: number, t: any) => acc + (t.diffFromAvg || 0), 0) / topTalents.length / 15
          : 0;

        return {
          ...tp,
          topCompetencies,
          topTalents,
          topTalentsSummary,
          totalPopulation,
          confidenceLevel,
          thresholdValue: null, // No disponible en pre-calculados
          statistics: {
            significantCompetencies,
            significantTalents,
            avgEffectSizeCompetencies: Math.round(avgEffectSizeCompetencies * 100) / 100,
            avgEffectSizeTalents: Math.round(avgEffectSizeTalents * 100) / 100,
          },
        };
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
