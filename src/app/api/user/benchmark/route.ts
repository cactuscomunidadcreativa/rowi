import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth";
import { prisma } from "@/core/prisma";

/**
 * 📊 User Benchmark API
 * Permite al usuario compararse con diferentes benchmarks:
 * - Su comunidad (computa on-the-fly desde EqSnapshots de miembros)
 * - El Rowiverse global (usa BenchmarkStatistic precalculado)
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

// Competency keys del modelo SEI
const COMPETENCY_KEYS = ["K", "C", "G", "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"] as const;

/**
 * Calcula estadísticas (mean, p50, p75, p90) de un array de valores numéricos
 */
function computeStatsFromValues(values: number[]): { mean: number; p50: number; p75: number; p90: number } {
  if (values.length === 0) return { mean: 0, p50: 0, p75: 0, p90: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const pct = (p: number) => sorted[Math.min(Math.floor((p / 100) * n), n - 1)];
  return {
    mean: Math.round(mean * 10) / 10,
    p50: pct(50),
    p75: pct(75),
    p90: pct(90),
  };
}

/**
 * Computa benchmark de comunidad on-the-fly a partir de EqSnapshots de los miembros.
 * Retorna stats por competencia/talento + perfil de top performers.
 */
async function computeCommunityBenchmark(
  user: {
    id: string;
    primaryTenantId: string | null;
    rowiCommunities: Array<{
      community: { id: string; name: string; tenantId: string | null };
    }>;
    communityMemberships: Array<{ tenantId: string | null }>;
  },
  outcome: string
): Promise<{
  benchmarkStats: Record<string, { mean: number; p50: number; p75: number; p90: number }>;
  topPerformerProfile: {
    outcomeKey: string;
    sampleSize: number;
    avgK: number; avgC: number; avgG: number;
    avgEL: number; avgRP: number; avgACT: number;
    avgNE: number; avgIM: number; avgOP: number;
    avgEMP: number; avgNG: number;
    topCompetencies: unknown;
    topTalentsSummary: unknown;
  } | null;
  benchmarkInfo: { id: string; name: string; type: string; totalRows: number };
  error?: string;
}> {
  // 1. Resolver comunidad
  const rowiCommunity = user.rowiCommunities?.[0]?.community;
  const communityId = rowiCommunity?.id;
  const tenantId = rowiCommunity?.tenantId
    || user.communityMemberships?.[0]?.tenantId
    || user.primaryTenantId;

  if (!communityId && !tenantId) {
    return {
      benchmarkStats: {},
      topPerformerProfile: null,
      benchmarkInfo: { id: "no-community", name: "Sin Comunidad", type: "COMMUNITY", totalRows: 0 },
      error: "No perteneces a ninguna comunidad.",
    };
  }

  // 2. Obtener userIds de miembros de la comunidad
  let memberUserIds: string[] = [];

  if (communityId) {
    const members = await prisma.rowiCommunityUser.findMany({
      where: {
        communityId,
        userId: { not: null },
        status: "active",
      },
      select: { userId: true },
    });
    memberUserIds = members.map((m) => m.userId).filter((id): id is string => !!id);
  }

  // Fallback: si no hay miembros via RowiCommunity, buscar en CommunityMember
  if (memberUserIds.length === 0 && tenantId) {
    const tenantMembers = await prisma.communityMember.findMany({
      where: {
        tenantId,
        userId: { not: null },
        status: "ACTIVE",
      },
      select: { userId: true },
    });
    memberUserIds = tenantMembers
      .map((m) => m.userId)
      .filter((id): id is string => !!id);
  }

  if (memberUserIds.length === 0) {
    return {
      benchmarkStats: {},
      topPerformerProfile: null,
      benchmarkInfo: {
        id: `community-${communityId || tenantId}`,
        name: rowiCommunity?.name || "Mi Comunidad",
        type: "COMMUNITY",
        totalRows: 0,
      },
      error: "Tu comunidad aún no tiene miembros con datos SEI.",
    };
  }

  // 3. Obtener el snapshot más reciente de cada miembro
  const memberSnapshots = await prisma.eqSnapshot.findMany({
    where: {
      userId: { in: memberUserIds },
    },
    orderBy: { at: "desc" },
    distinct: ["userId"],
    include: {
      talents: true,
      outcomes: true,
    },
  });

  if (memberSnapshots.length === 0) {
    return {
      benchmarkStats: {},
      topPerformerProfile: null,
      benchmarkInfo: {
        id: `community-${communityId || tenantId}`,
        name: rowiCommunity?.name || "Mi Comunidad",
        type: "COMMUNITY",
        totalRows: 0,
      },
      error: "Tu comunidad aún no tiene datos SEI para generar un benchmark.",
    };
  }

  // 4. Computar stats por competencia
  const benchmarkStats: Record<string, { mean: number; p50: number; p75: number; p90: number }> = {};

  for (const key of COMPETENCY_KEYS) {
    const values = memberSnapshots
      .map((s) => s[key])
      .filter((v): v is number => v != null);
    if (values.length > 0) {
      benchmarkStats[key] = computeStatsFromValues(values);
    }
  }

  // 5. Computar stats por talento
  const talentKeys = new Set<string>();
  for (const s of memberSnapshots) {
    for (const t of s.talents || []) {
      talentKeys.add(t.key);
    }
  }

  for (const key of talentKeys) {
    const values: number[] = [];
    for (const s of memberSnapshots) {
      const talent = (s.talents || []).find((t) => t.key === key);
      if (talent?.score != null) {
        values.push(talent.score);
      }
    }
    if (values.length > 0) {
      benchmarkStats[key] = computeStatsFromValues(values);
    }
  }

  // 6. Computar top performers para el outcome seleccionado
  let topPerformerProfile = null;

  // Recoger scores de outcome para cada miembro
  const memberOutcomes: Array<{
    snapshot: typeof memberSnapshots[number];
    outcomeScore: number;
  }> = [];

  for (const s of memberSnapshots) {
    const outcomeEntry = (s.outcomes || []).find((o) => o.key === outcome);
    if (outcomeEntry?.score != null) {
      memberOutcomes.push({ snapshot: s, outcomeScore: outcomeEntry.score });
    }
  }

  if (memberOutcomes.length >= 3) {
    // Ordenar por outcome score descendente
    memberOutcomes.sort((a, b) => b.outcomeScore - a.outcomeScore);

    // Top 10% (mínimo 1)
    const topCount = Math.max(1, Math.floor(memberOutcomes.length * 0.1));
    const topPerformers = memberOutcomes.slice(0, topCount);

    // Promediar competencias de top performers
    const avgCompetency = (key: typeof COMPETENCY_KEYS[number]) => {
      const vals = topPerformers
        .map((tp) => tp.snapshot[key])
        .filter((v): v is number => v != null);
      return vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
    };

    // Top competencias (ordenadas por score)
    const avgScores = COMPETENCY_KEYS.map((key) => ({
      key,
      avg: avgCompetency(key),
    })).sort((a, b) => b.avg - a.avg);

    // Top talentos de top performers
    const talentAvgs: Record<string, number[]> = {};
    for (const tp of topPerformers) {
      for (const t of tp.snapshot.talents || []) {
        if (t.score != null) {
          if (!talentAvgs[t.key]) talentAvgs[t.key] = [];
          talentAvgs[t.key].push(t.score);
        }
      }
    }
    const topTalents = Object.entries(talentAvgs)
      .map(([key, vals]) => ({
        key,
        avg: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);

    topPerformerProfile = {
      outcomeKey: outcome,
      sampleSize: topPerformers.length,
      avgK: avgCompetency("K"),
      avgC: avgCompetency("C"),
      avgG: avgCompetency("G"),
      avgEL: avgCompetency("EL"),
      avgRP: avgCompetency("RP"),
      avgACT: avgCompetency("ACT"),
      avgNE: avgCompetency("NE"),
      avgIM: avgCompetency("IM"),
      avgOP: avgCompetency("OP"),
      avgEMP: avgCompetency("EMP"),
      avgNG: avgCompetency("NG"),
      topCompetencies: avgScores.slice(0, 3).map((s) => ({
        key: s.key,
        label: COMPETENCY_LABELS[s.key]?.es || s.key,
        avg: s.avg,
      })),
      topTalentsSummary: topTalents.map((t) => ({
        key: t.key,
        label: TALENT_LABELS[t.key]?.es || t.key,
        avg: t.avg,
      })),
    };
  }

  const communityName = rowiCommunity?.name || "Mi Comunidad";
  const sampleLabel = memberSnapshots.length < 5
    ? `${communityName} (${memberSnapshots.length} miembros)`
    : communityName;

  return {
    benchmarkStats,
    topPerformerProfile,
    benchmarkInfo: {
      id: `community-${communityId || tenantId}`,
      name: sampleLabel,
      type: "COMMUNITY",
      totalRows: memberSnapshots.length,
    },
  };
}

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

    // 1. Obtener usuario con su último snapshot EQ + comunidades
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
        rowiCommunities: {
          take: 1,
          include: {
            community: {
              select: { id: true, name: true, tenantId: true },
            },
          },
        },
        communityMemberships: {
          take: 1,
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
    let benchmark: {
      id: string;
      name: string;
      type: string;
      totalRows: number | null;
      statistics?: Array<{ metricKey: string; mean: number | null; p50: number | null; p75: number | null; p90: number | null }>;
      topPerformers?: Array<{
        outcomeKey: string;
        sampleSize: number | null;
        avgK: number | null; avgC: number | null; avgG: number | null;
        avgEL: number | null; avgRP: number | null; avgACT: number | null;
        avgNE: number | null; avgIM: number | null; avgOP: number | null;
        avgEMP: number | null; avgNG: number | null;
        topCompetencies: unknown; topTalents: unknown; topTalentsSummary: unknown;
      }>;
    } | null = null;

    let benchmarkStats: Record<string, { mean: number; p50: number; p75: number; p90: number }> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let communityTopPerformerProfile: any = null;

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

      // Extraer stats del benchmark
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
    } else if (compareWith === "community") {
      // Computar benchmark de comunidad on-the-fly desde EqSnapshots
      const communityResult = await computeCommunityBenchmark(
        user as Parameters<typeof computeCommunityBenchmark>[0],
        outcome
      );

      if (communityResult.error && Object.keys(communityResult.benchmarkStats).length === 0) {
        return NextResponse.json({
          ok: false,
          error: communityResult.error,
          noData: true,
        });
      }

      benchmarkStats = communityResult.benchmarkStats;
      communityTopPerformerProfile = communityResult.topPerformerProfile;

      // Crear virtual benchmark info
      benchmark = {
        id: communityResult.benchmarkInfo.id,
        name: communityResult.benchmarkInfo.name,
        type: communityResult.benchmarkInfo.type,
        totalRows: communityResult.benchmarkInfo.totalRows,
      };
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

    // 7. Obtener perfil de top performers (benchmark DB o community computed)
    const topPerformerProfile = compareWith === "community"
      ? communityTopPerformerProfile as any
      : benchmark?.topPerformers?.[0] || null;

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

    // 10. Obtener filtros disponibles
    const realBenchmarkId = compareWith !== "community" && benchmark ? benchmark.id : null;
    const availableFilters = realBenchmarkId
      ? await prisma.benchmarkDataPoint.groupBy({
          by: ["jobRole", "sector", "country"],
          where: { benchmarkId: realBenchmarkId },
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
