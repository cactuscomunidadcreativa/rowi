import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth";
import { prisma } from "@/core/prisma";

/**
 * 📊 User Benchmark API
 * Permite al usuario compararse con diferentes benchmarks:
 * - Su comunidad
 * - El Rowiverse global
 * - Benchmarks específicos
 */

// Mapeo de competencias SEI
const COMPETENCY_LABELS: Record<string, { es: string; en: string }> = {
  K: { es: "Conocerse", en: "Know Yourself" },
  C: { es: "Elegirse", en: "Choose Yourself" },
  G: { es: "Darse", en: "Give Yourself" },
  EL: { es: "Alfabetización Emocional", en: "Emotional Literacy" },
  RP: { es: "Reconocer Patrones", en: "Recognize Patterns" },
  ACT: { es: "Pensamiento Consecuente", en: "Consequential Thinking" },
  NE: { es: "Navegar Emociones", en: "Navigate Emotions" },
  IM: { es: "Motivación Intrínseca", en: "Intrinsic Motivation" },
  OP: { es: "Ejercer Optimismo", en: "Exercise Optimism" },
  EMP: { es: "Empatía", en: "Empathy" },
  NG: { es: "Metas Nobles", en: "Noble Goals" },
};

// Mapeo de talentos
const TALENT_LABELS: Record<string, { es: string; en: string }> = {
  dataMining: { es: "Minería de Datos", en: "Data Mining" },
  modeling: { es: "Modelado", en: "Modeling" },
  prioritizing: { es: "Priorización", en: "Prioritizing" },
  connection: { es: "Conexión", en: "Connection" },
  emotionalInsight: { es: "Insight Emocional", en: "Emotional Insight" },
  collaboration: { es: "Colaboración", en: "Collaboration" },
  reflecting: { es: "Reflexión", en: "Reflecting" },
  adaptability: { es: "Adaptabilidad", en: "Adaptability" },
  criticalThinking: { es: "Pensamiento Crítico", en: "Critical Thinking" },
  resilience: { es: "Resiliencia", en: "Resilience" },
  riskTolerance: { es: "Tolerancia al Riesgo", en: "Risk Tolerance" },
  imagination: { es: "Imaginación", en: "Imagination" },
  proactivity: { es: "Proactividad", en: "Proactivity" },
  commitment: { es: "Compromiso", en: "Commitment" },
  problemSolving: { es: "Resolución de Problemas", en: "Problem Solving" },
  vision: { es: "Visión", en: "Vision" },
  designing: { es: "Diseño", en: "Designing" },
  entrepreneurship: { es: "Emprendimiento", en: "Entrepreneurship" },
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autenticado" });
    }

    const { searchParams } = new URL(req.url);
    const compareWith = searchParams.get("compareWith") || "rowiverse"; // rowiverse | community | benchmark
    const benchmarkId = searchParams.get("benchmarkId");
    const outcome = searchParams.get("outcome") || "effectiveness";

    // 1. Obtener usuario con su último snapshot EQ
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        eqSnapshots: {
          orderBy: { at: "desc" },
          take: 1,
          include: {
            talents: true,
            competencies: true,
            outcomes: true,
          },
        },
        communityMemberships: {
          take: 1,
          // CommunityMember doesn't have a 'community' relation - it uses tenantId directly
        },
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" });
    }

    const snapshot = user.eqSnapshots?.[0];
    if (!snapshot) {
      return NextResponse.json({
        ok: false,
        error: "No tienes evaluación SEI. Completa tu evaluación para compararte.",
        noData: true,
      });
    }

    // 2. Extraer datos del usuario
    const userCompetencies = {
      K: snapshot.K,
      C: snapshot.C,
      G: snapshot.G,
      EL: snapshot.EL,
      RP: snapshot.RP,
      ACT: snapshot.ACT,
      NE: snapshot.NE,
      IM: snapshot.IM,
      OP: snapshot.OP,
      EMP: snapshot.EMP,
      NG: snapshot.NG,
    };

    // Extraer talentos del snapshot (excluir brainAgility que es una métrica separada)
    const EXCLUDED_TALENTS = ["brainAgility", "BrainAgility", "brain_agility"];
    const userTalents: Record<string, number | null> = {};
    for (const t of snapshot.talents || []) {
      if (!EXCLUDED_TALENTS.includes(t.key)) {
        userTalents[t.key] = t.score;
      }
    }

    // 3. Buscar benchmark según el tipo de comparación
    let benchmark = null;
    let benchmarkData = null;

    if (compareWith === "rowiverse" || compareWith === "benchmark") {
      // Buscar benchmark activo del Rowiverse o específico
      const whereClause = benchmarkId
        ? { id: benchmarkId }
        : { type: "ROWIVERSE" as const, isActive: true };

      benchmark = await prisma.benchmark.findFirst({
        where: whereClause,
        include: {
          statistics: {
            where: {
              // Sin filtros específicos = global
              country: null,
              region: null,
              sector: null,
            },
          },
          topPerformers: {
            where: {
              outcomeKey: outcome,
              country: null,
              region: null,
            },
            take: 1,
          },
        },
      });
    } else if (compareWith === "community") {
      // Comparar con la comunidad del usuario (usando tenantId)
      const tenantId = user.communityMemberships?.[0]?.tenantId || user.primaryTenantId;
      if (tenantId) {
        benchmark = await prisma.benchmark.findFirst({
          where: {
            tenantId,
            isActive: true,
          },
          include: {
            statistics: true,
            topPerformers: {
              where: { outcomeKey: outcome },
              take: 1,
            },
          },
        });
      }
    }

    // 4. Calcular estadísticas del benchmark
    let benchmarkStats: Record<string, { mean: number; p50: number; p75: number; p90: number }> = {};

    if (benchmark?.statistics) {
      for (const stat of benchmark.statistics) {
        benchmarkStats[stat.metricKey] = {
          mean: stat.mean || 0,
          p50: stat.p50 || 0,
          p75: stat.p75 || 0,
          p90: stat.p90 || 0,
        };
      }
    }

    // 5. Calcular top 3 competencias del usuario
    const competencyScores = Object.entries(userCompetencies)
      .filter(([_, v]) => v != null)
      .map(([key, value]) => ({
        key,
        score: value as number,
        benchmarkMean: benchmarkStats[key]?.mean || 50,
        percentile: calculatePercentile(value as number, benchmarkStats[key]),
      }))
      .sort((a, b) => b.score - a.score);

    const top3Competencies = competencyScores.slice(0, 3);

    // 6. Calcular top 5 talentos del usuario
    const talentScores = Object.entries(userTalents)
      .filter(([_, v]) => v != null)
      .map(([key, value]) => ({
        key,
        score: value as number,
        benchmarkMean: benchmarkStats[key]?.mean || 50,
      }))
      .sort((a, b) => b.score - a.score);

    const top5Talents = talentScores.slice(0, 5);

    // 7. Obtener perfil de top performers
    const topPerformerProfile = benchmark?.topPerformers?.[0];

    // 8. Calcular comparación con top performers
    let topPerformerComparison = null;
    if (topPerformerProfile) {
      const tpCompetencies = {
        K: topPerformerProfile.avgK,
        C: topPerformerProfile.avgC,
        G: topPerformerProfile.avgG,
        EL: topPerformerProfile.avgEL,
        RP: topPerformerProfile.avgRP,
        ACT: topPerformerProfile.avgACT,
        NE: topPerformerProfile.avgNE,
        IM: topPerformerProfile.avgIM,
        OP: topPerformerProfile.avgOP,
        EMP: topPerformerProfile.avgEMP,
        NG: topPerformerProfile.avgNG,
      };

      topPerformerComparison = Object.entries(userCompetencies)
        .filter(([_, v]) => v != null)
        .map(([key, value]) => ({
          key,
          userScore: value as number,
          topPerformerAvg: tpCompetencies[key as keyof typeof tpCompetencies] || 0,
          gap: (value as number) - (tpCompetencies[key as keyof typeof tpCompetencies] || 0),
        }));
    }

    // 9. Obtener lista de benchmarks disponibles para comparar
    const availableBenchmarks = await prisma.benchmark.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        scope: true,
        totalRows: true,
      },
      orderBy: { name: "asc" },
    });

    // 10. Obtener filtros disponibles (para filtrar por rol, sector, etc.)
    const availableFilters = benchmark
      ? await prisma.benchmarkDataPoint.groupBy({
          by: ["jobRole", "sector", "country"],
          where: { benchmarkId: benchmark.id },
          _count: true,
        })
      : [];

    const filters = {
      jobRoles: [...new Set(availableFilters.map((f) => f.jobRole).filter(Boolean))],
      sectors: [...new Set(availableFilters.map((f) => f.sector).filter(Boolean))],
      countries: [...new Set(availableFilters.map((f) => f.country).filter(Boolean))],
    };

    // 11. Respuesta
    return NextResponse.json({
      ok: true,
      user: {
        name: user.name,
        brainStyle: snapshot.brainStyle,
        country: user.country,
        sector: snapshot.sector,
        jobRole: snapshot.jobRole,
      },
      competencies: competencyScores,
      talents: talentScores,
      top3Competencies,
      top5Talents,
      benchmark: benchmark
        ? {
            id: benchmark.id,
            name: benchmark.name,
            type: benchmark.type,
            totalRows: benchmark.totalRows,
          }
        : null,
      benchmarkStats,
      topPerformerProfile: topPerformerProfile
        ? {
            outcomeKey: topPerformerProfile.outcomeKey,
            sampleSize: topPerformerProfile.sampleSize,
            topCompetencies: topPerformerProfile.topCompetencies,
            topTalents: topPerformerProfile.topTalentsSummary || topPerformerProfile.topTalents,
          }
        : null,
      topPerformerComparison,
      availableBenchmarks,
      filters,
      labels: {
        competencies: COMPETENCY_LABELS,
        talents: TALENT_LABELS,
      },
    });
  } catch (e: any) {
    console.error("User Benchmark API error:", e);
    return NextResponse.json({ ok: false, error: e.message });
  }
}

// Función para calcular percentil aproximado
function calculatePercentile(
  value: number,
  stats?: { mean: number; p50: number; p75: number; p90: number }
): number {
  if (!stats) return 50;

  if (value >= stats.p90) return 90 + ((value - stats.p90) / (100 - stats.p90)) * 10;
  if (value >= stats.p75) return 75 + ((value - stats.p75) / (stats.p90 - stats.p75)) * 15;
  if (value >= stats.p50) return 50 + ((value - stats.p50) / (stats.p75 - stats.p50)) * 25;
  return Math.max(0, (value / stats.p50) * 50);
}
