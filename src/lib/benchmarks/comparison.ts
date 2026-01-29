/**
 * 🔄 BENCHMARK COMPARISON
 * Lógica de comparación "Fortalezas Primero"
 */

import {
  calculateStats,
  extractMetricValues,
  filterDataPoints,
  calculatePercentileRank,
  mean,
  type DataPointFilters,
  MIN_SAMPLE_SIZE,
} from "./statistics";
import {
  calculateTopPerformerProfile,
  type TopPerformerProfile,
  type CompetencyRanking,
} from "./top-performers";
import {
  withFallbackSync,
  type FallbackContext,
  type FallbackLevel,
} from "./fallback";
import { EQ_COMPETENCIES, BRAIN_TALENTS, OUTCOMES } from "./column-mapping";

// =========================================================
// 📊 TIPOS
// =========================================================

export interface UserProfile {
  K?: number | null;
  C?: number | null;
  G?: number | null;
  EL?: number | null;
  RP?: number | null;
  ACT?: number | null;
  NE?: number | null;
  IM?: number | null;
  OP?: number | null;
  EMP?: number | null;
  NG?: number | null;
  [key: string]: number | null | undefined;
}

export interface UserStrength {
  competency: string;
  score: number;
  percentile: number;
  vsTopPerformer: "above" | "at" | "below";
  diffFromTopPerformer: number;
}

export interface TopPerformerInsight {
  strength: string;
  howTheyUseIt: string;
  resultTheyGet: string;
}

export interface DevelopmentArea {
  area: string;
  priority: "high" | "medium" | "low";
  leveragedBy: string[]; // Fortalezas que apalancan esta área
  actionSuggestion: string;
  currentScore: number;
  topPerformerScore: number;
  gap: number;
}

export interface ComparisonResult {
  targetOutcome: string;
  context: FallbackContext;
  fallbackLevel: FallbackLevel;
  sampleSize: number;

  // Fortalezas del usuario (primero)
  userStrengths: UserStrength[];

  // Insights de top performers
  topPerformerInsights: TopPerformerInsight[];

  // Áreas de desarrollo
  developmentAreas: DevelopmentArea[];

  // Scores comparativos
  userScores: Record<string, number | null>;
  benchmarkScores: Record<string, number | null>;
  percentiles: Record<string, number>;

  // Resumen
  summaryInsight: string;
}

// =========================================================
// 🎯 COMPARACIÓN "FORTALEZAS PRIMERO"
// =========================================================

/**
 * Realiza una comparación completa del usuario contra el benchmark
 * Siguiendo el enfoque "Fortalezas Primero"
 */
export function compareUserToBenchmark(
  userProfile: UserProfile,
  dataPoints: any[],
  targetOutcome: string,
  context: FallbackContext
): ComparisonResult | null {
  // 1. Buscar top performers con fallback automático
  const fallbackResult = withFallbackSync(
    context,
    (ctx) => {
      const filtered = filterDataPoints(dataPoints, ctx as DataPointFilters);
      const profile = calculateTopPerformerProfile(
        filtered,
        targetOutcome,
        90,
        ctx as DataPointFilters
      );
      return {
        data: profile,
        sampleSize: filtered.length,
      };
    }
  );

  if (!fallbackResult.data) {
    return null;
  }

  const topPerformerProfile = fallbackResult.data;
  const filteredData = filterDataPoints(
    dataPoints,
    fallbackResult.usedContext as DataPointFilters
  );

  // 2. Identificar las FORTALEZAS del usuario (sus scores más altos)
  const userStrengths = identifyUserStrengths(
    userProfile,
    filteredData,
    topPerformerProfile
  );

  // 3. Generar insights de cómo los top performers usan fortalezas similares
  const topPerformerInsights = generateTopPerformerInsights(
    userStrengths,
    topPerformerProfile,
    targetOutcome
  );

  // 4. Identificar áreas de desarrollo apalancadas en fortalezas
  const developmentAreas = identifyDevelopmentAreas(
    userProfile,
    userStrengths,
    topPerformerProfile
  );

  // 5. Calcular scores y percentiles
  const { userScores, benchmarkScores, percentiles } = calculateComparativeScores(
    userProfile,
    filteredData,
    topPerformerProfile
  );

  // 6. Generar resumen
  const summaryInsight = generateSummaryInsight(
    userStrengths,
    developmentAreas,
    targetOutcome
  );

  return {
    targetOutcome,
    context: fallbackResult.usedContext,
    fallbackLevel: fallbackResult.fallbackLevel,
    sampleSize: fallbackResult.sampleSize,
    userStrengths,
    topPerformerInsights,
    developmentAreas,
    userScores,
    benchmarkScores,
    percentiles,
    summaryInsight,
  };
}

// =========================================================
// 💪 IDENTIFICACIÓN DE FORTALEZAS
// =========================================================

/**
 * Identifica las fortalezas del usuario (sus scores más altos)
 */
function identifyUserStrengths(
  userProfile: UserProfile,
  dataPoints: any[],
  topPerformerProfile: TopPerformerProfile
): UserStrength[] {
  const strengths: UserStrength[] = [];

  // Mapeo de competencias a promedios de top performers
  const topPerformerAvgs: Record<string, number | null> = {
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

  for (const comp of EQ_COMPETENCIES) {
    const userScore = userProfile[comp];
    if (userScore === null || userScore === undefined) continue;

    // Calcular percentil del usuario
    const benchmarkValues = extractMetricValues(dataPoints, comp);
    const percentile = calculatePercentileRank(userScore, benchmarkValues);

    // Comparar con top performers
    const topAvg = topPerformerAvgs[comp];
    let vsTopPerformer: UserStrength["vsTopPerformer"] = "below";
    let diffFromTopPerformer = 0;

    if (topAvg !== null) {
      diffFromTopPerformer = userScore - topAvg;
      if (diffFromTopPerformer > 2) {
        vsTopPerformer = "above";
      } else if (diffFromTopPerformer >= -2) {
        vsTopPerformer = "at";
      } else {
        vsTopPerformer = "below";
      }
    }

    strengths.push({
      competency: comp,
      score: userScore,
      percentile,
      vsTopPerformer,
      diffFromTopPerformer,
    });
  }

  // Ordenar por percentil (las fortalezas reales del usuario)
  strengths.sort((a, b) => b.percentile - a.percentile);

  // Retornar solo las top 5 fortalezas (percentil > 50)
  return strengths.filter((s) => s.percentile >= 50).slice(0, 5);
}

// =========================================================
// 💡 INSIGHTS DE TOP PERFORMERS
// =========================================================

/**
 * Genera insights sobre cómo los top performers usan fortalezas similares
 */
function generateTopPerformerInsights(
  userStrengths: UserStrength[],
  topPerformerProfile: TopPerformerProfile,
  targetOutcome: string
): TopPerformerInsight[] {
  const insights: TopPerformerInsight[] = [];

  // Mapeo de competencias a descripciones de uso
  const competencyUsage: Record<string, { use: string; result: string }> = {
    K: {
      use: "insight_K_use",
      result: "insight_K_result",
    },
    C: {
      use: "insight_C_use",
      result: "insight_C_result",
    },
    G: {
      use: "insight_G_use",
      result: "insight_G_result",
    },
    EL: {
      use: "insight_EL_use",
      result: "insight_EL_result",
    },
    RP: {
      use: "insight_RP_use",
      result: "insight_RP_result",
    },
    ACT: {
      use: "insight_ACT_use",
      result: "insight_ACT_result",
    },
    NE: {
      use: "insight_NE_use",
      result: "insight_NE_result",
    },
    IM: {
      use: "insight_IM_use",
      result: "insight_IM_result",
    },
    OP: {
      use: "insight_OP_use",
      result: "insight_OP_result",
    },
    EMP: {
      use: "insight_EMP_use",
      result: "insight_EMP_result",
    },
    NG: {
      use: "insight_NG_use",
      result: "insight_NG_result",
    },
  };

  // Para cada fortaleza del usuario, generar insight
  for (const strength of userStrengths.slice(0, 3)) {
    const usage = competencyUsage[strength.competency];
    if (usage) {
      insights.push({
        strength: strength.competency,
        howTheyUseIt: usage.use,
        resultTheyGet: usage.result,
      });
    }
  }

  return insights;
}

// =========================================================
// 📈 ÁREAS DE DESARROLLO
// =========================================================

/**
 * Identifica áreas de desarrollo apalancadas en fortalezas existentes
 */
function identifyDevelopmentAreas(
  userProfile: UserProfile,
  userStrengths: UserStrength[],
  topPerformerProfile: TopPerformerProfile
): DevelopmentArea[] {
  const areas: DevelopmentArea[] = [];
  const strengthCompetencies = userStrengths.map((s) => s.competency);

  // Mapeo de competencias a promedios de top performers
  const topPerformerAvgs: Record<string, number | null> = {
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

  // Mapeo de qué competencias se apalancan mutuamente
  const leverageMap: Record<string, string[]> = {
    EL: ["NE", "EMP"], // Literacy ayuda a navegar y empatizar
    RP: ["ACT", "NE"], // Reconocer patrones ayuda a pensar consecuencias y navegar
    ACT: ["RP", "IM"], // Pensamiento consecuente se apalanca de patrones y motivación
    NE: ["EL", "OP"], // Navegar emociones se apoya en literacy y optimismo
    IM: ["NG", "OP"], // Motivación intrínseca se apoya en metas nobles y optimismo
    OP: ["IM", "NG"], // Optimismo se apoya en motivación y metas
    EMP: ["EL", "NG"], // Empatía se apoya en literacy y metas nobles
    NG: ["IM", "EMP"], // Metas nobles se apoyan en motivación y empatía
  };

  // Identificar áreas donde el usuario está por debajo de los top performers
  for (const comp of EQ_COMPETENCIES) {
    // Saltar si ya es una fortaleza
    if (strengthCompetencies.includes(comp)) continue;

    const userScore = userProfile[comp];
    const topAvg = topPerformerAvgs[comp];

    if (userScore === null || userScore === undefined || topAvg === null) continue;

    const gap = topAvg - userScore;

    // Solo considerar si hay un gap significativo (> 5 puntos)
    if (gap <= 5) continue;

    // Encontrar qué fortalezas del usuario pueden apalancar esta área
    const leveragedBy: string[] = [];
    for (const strength of strengthCompetencies) {
      if (leverageMap[comp]?.includes(strength) || leverageMap[strength]?.includes(comp)) {
        leveragedBy.push(strength);
      }
    }

    // Determinar prioridad basada en gap y si tiene apalancamiento
    let priority: DevelopmentArea["priority"] = "low";
    if (gap > 15 && leveragedBy.length > 0) {
      priority = "high";
    } else if (gap > 10 || leveragedBy.length > 1) {
      priority = "medium";
    }

    areas.push({
      area: comp,
      priority,
      leveragedBy,
      actionSuggestion: `action_${comp}`,
      currentScore: userScore,
      topPerformerScore: topAvg,
      gap,
    });
  }

  // Ordenar por prioridad y gap
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  areas.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.gap - a.gap;
  });

  return areas.slice(0, 3);
}

// =========================================================
// 📊 SCORES COMPARATIVOS
// =========================================================

/**
 * Calcula scores comparativos y percentiles
 */
function calculateComparativeScores(
  userProfile: UserProfile,
  dataPoints: any[],
  topPerformerProfile: TopPerformerProfile
): {
  userScores: Record<string, number | null>;
  benchmarkScores: Record<string, number | null>;
  percentiles: Record<string, number>;
} {
  const userScores: Record<string, number | null> = {};
  const benchmarkScores: Record<string, number | null> = {};
  const percentiles: Record<string, number> = {};

  for (const comp of EQ_COMPETENCIES) {
    const userScore = userProfile[comp] ?? null;
    userScores[comp] = userScore;

    // Benchmark score = promedio de top performers
    const topPerformerAvgs: Record<string, number | null> = {
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
    benchmarkScores[comp] = topPerformerAvgs[comp];

    // Calcular percentil
    if (userScore !== null) {
      const benchmarkValues = extractMetricValues(dataPoints, comp);
      percentiles[comp] = calculatePercentileRank(userScore, benchmarkValues);
    } else {
      percentiles[comp] = 0;
    }
  }

  return { userScores, benchmarkScores, percentiles };
}

// =========================================================
// 📝 RESUMEN
// =========================================================

/**
 * Genera un resumen estratégico de la comparación
 */
function generateSummaryInsight(
  userStrengths: UserStrength[],
  developmentAreas: DevelopmentArea[],
  targetOutcome: string
): string {
  // El resumen se genera como una clave de traducción con parámetros
  // que será interpretada por el frontend

  const topStrength = userStrengths[0]?.competency || "none";
  const topDevelopment = developmentAreas[0]?.area || "none";
  const leveragedBy = developmentAreas[0]?.leveragedBy?.[0] || "none";

  return `summary:${targetOutcome}:${topStrength}:${topDevelopment}:${leveragedBy}`;
}
