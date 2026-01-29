/**
 * 🏆 TOP PERFORMERS
 * Identificación y análisis de top performers por outcome
 */

import {
  calculateStats,
  filterDataPoints,
  extractMetricValues,
  mean,
  percentile,
  type DataPointFilters,
  MIN_SAMPLE_SIZE,
} from "./statistics";
import { EQ_COMPETENCIES, BRAIN_TALENTS, OUTCOMES } from "./column-mapping";

// =========================================================
// 📊 TIPOS
// =========================================================

export interface TopPerformerProfile {
  outcomeKey: string;
  percentileThreshold: number;
  sampleSize: number;
  avgK: number | null;
  avgC: number | null;
  avgG: number | null;
  avgEL: number | null;
  avgRP: number | null;
  avgACT: number | null;
  avgNE: number | null;
  avgIM: number | null;
  avgOP: number | null;
  avgEMP: number | null;
  avgNG: number | null;
  topCompetencies: CompetencyRanking[];
  topTalents: TalentRanking[];
  commonPatterns: Pattern[];
}

export interface CompetencyRanking {
  key: string;
  avgScore: number;
  importance: number; // 0-100
  diffFromAvg: number; // Diferencia vs promedio general
}

export interface TalentRanking {
  key: string;
  avgScore: number;
  importance: number;
}

export interface Pattern {
  competencies: string[];
  frequency: number; // % de top performers con este patrón
  avgOutcome: number;
}

// =========================================================
// 🏆 IDENTIFICACIÓN DE TOP PERFORMERS
// =========================================================

/**
 * Identifica los top performers para un outcome específico
 * @param dataPoints Array de data points
 * @param outcomeKey La métrica de outcome a optimizar
 * @param percentileThreshold Percentil mínimo (default: 90 = top 10%)
 * @param filters Filtros demográficos opcionales
 */
export function identifyTopPerformers(
  dataPoints: any[],
  outcomeKey: string,
  percentileThreshold: number = 90,
  filters: DataPointFilters = {}
): any[] {
  // Aplicar filtros demográficos
  const filteredData = filterDataPoints(dataPoints, filters);

  // Extraer valores del outcome
  const outcomeValues = extractMetricValues(filteredData, outcomeKey);
  if (outcomeValues.length < MIN_SAMPLE_SIZE) {
    return [];
  }

  // Calcular el umbral del percentil
  const threshold = percentile(outcomeValues, percentileThreshold);
  if (threshold === null) return [];

  // Filtrar los que están por encima del umbral
  return filteredData.filter((dp) => {
    const value = dp[outcomeKey];
    return value !== null && value !== undefined && value >= threshold;
  });
}

/**
 * Calcula el perfil promedio de los top performers
 */
export function calculateTopPerformerProfile(
  dataPoints: any[],
  outcomeKey: string,
  percentileThreshold: number = 90,
  filters: DataPointFilters = {}
): TopPerformerProfile | null {
  const topPerformers = identifyTopPerformers(
    dataPoints,
    outcomeKey,
    percentileThreshold,
    filters
  );

  if (topPerformers.length < MIN_SAMPLE_SIZE) {
    return null;
  }

  // Calcular promedios de competencias para top performers
  const avgK = mean(extractMetricValues(topPerformers, "K"));
  const avgC = mean(extractMetricValues(topPerformers, "C"));
  const avgG = mean(extractMetricValues(topPerformers, "G"));
  const avgEL = mean(extractMetricValues(topPerformers, "EL"));
  const avgRP = mean(extractMetricValues(topPerformers, "RP"));
  const avgACT = mean(extractMetricValues(topPerformers, "ACT"));
  const avgNE = mean(extractMetricValues(topPerformers, "NE"));
  const avgIM = mean(extractMetricValues(topPerformers, "IM"));
  const avgOP = mean(extractMetricValues(topPerformers, "OP"));
  const avgEMP = mean(extractMetricValues(topPerformers, "EMP"));
  const avgNG = mean(extractMetricValues(topPerformers, "NG"));

  // Calcular ranking de competencias
  const topCompetencies = calculateCompetencyRanking(
    dataPoints,
    topPerformers,
    filters
  );

  // Calcular ranking de talentos
  const topTalents = calculateTalentRanking(topPerformers);

  // Detectar patrones comunes
  const commonPatterns = detectCommonPatterns(topPerformers, outcomeKey);

  return {
    outcomeKey,
    percentileThreshold,
    sampleSize: topPerformers.length,
    avgK,
    avgC,
    avgG,
    avgEL,
    avgRP,
    avgACT,
    avgNE,
    avgIM,
    avgOP,
    avgEMP,
    avgNG,
    topCompetencies,
    topTalents,
    commonPatterns,
  };
}

// =========================================================
// 📈 RANKING DE COMPETENCIAS
// =========================================================

/**
 * Calcula el ranking de competencias distintivas de los top performers
 */
function calculateCompetencyRanking(
  allDataPoints: any[],
  topPerformers: any[],
  filters: DataPointFilters
): CompetencyRanking[] {
  const filteredAll = filterDataPoints(allDataPoints, filters);
  const rankings: CompetencyRanking[] = [];

  for (const competency of EQ_COMPETENCIES) {
    const topValues = extractMetricValues(topPerformers, competency);
    const allValues = extractMetricValues(filteredAll, competency);

    const topAvg = mean(topValues);
    const allAvg = mean(allValues);

    if (topAvg !== null && allAvg !== null) {
      const diffFromAvg = topAvg - allAvg;

      // Importancia = qué tanto se diferencian los top performers en esta competencia
      // Normalizado a 0-100
      const allStats = calculateStats(allValues);
      const importance =
        allStats.stdDev && allStats.stdDev > 0
          ? Math.min(100, Math.max(0, (diffFromAvg / allStats.stdDev) * 25 + 50))
          : 50;

      rankings.push({
        key: competency,
        avgScore: topAvg,
        importance,
        diffFromAvg,
      });
    }
  }

  // Ordenar por importancia (mayor diferencia = más distintivo)
  return rankings.sort((a, b) => b.diffFromAvg - a.diffFromAvg);
}

/**
 * Calcula el ranking de talentos en los top performers
 */
function calculateTalentRanking(topPerformers: any[]): TalentRanking[] {
  const rankings: TalentRanking[] = [];

  for (const talent of BRAIN_TALENTS) {
    const values = extractMetricValues(topPerformers, talent);
    const avg = mean(values);

    if (avg !== null) {
      // Importancia basada en el score promedio (más alto = más importante)
      const importance = Math.min(100, Math.max(0, avg));

      rankings.push({
        key: talent,
        avgScore: avg,
        importance,
      });
    }
  }

  return rankings.sort((a, b) => b.importance - a.importance);
}

// =========================================================
// 🔍 DETECCIÓN DE PATRONES
// =========================================================

/**
 * Detecta patrones comunes de competencias en los top performers
 */
function detectCommonPatterns(
  topPerformers: any[],
  outcomeKey: string
): Pattern[] {
  const patterns: Pattern[] = [];
  const n = topPerformers.length;

  if (n < MIN_SAMPLE_SIZE) return [];

  // Identificar las top 3 competencias de cada persona
  const personPatterns: string[][] = [];

  for (const performer of topPerformers) {
    const competencyScores: { key: string; score: number }[] = [];

    for (const comp of EQ_COMPETENCIES) {
      const score = performer[comp];
      if (score !== null && score !== undefined) {
        competencyScores.push({ key: comp, score });
      }
    }

    // Ordenar por score y tomar top 3
    competencyScores.sort((a, b) => b.score - a.score);
    const topThree = competencyScores.slice(0, 3).map((c) => c.key);
    personPatterns.push(topThree);
  }

  // Contar frecuencia de combinaciones de 2 competencias
  const pairCounts: Record<string, { count: number; outcomes: number[] }> = {};

  for (let i = 0; i < personPatterns.length; i++) {
    const pattern = personPatterns[i];
    const outcomeValue = topPerformers[i][outcomeKey] || 0;

    // Generar todas las combinaciones de 2
    for (let j = 0; j < pattern.length; j++) {
      for (let k = j + 1; k < pattern.length; k++) {
        const pair = [pattern[j], pattern[k]].sort().join("+");
        if (!pairCounts[pair]) {
          pairCounts[pair] = { count: 0, outcomes: [] };
        }
        pairCounts[pair].count++;
        pairCounts[pair].outcomes.push(outcomeValue);
      }
    }
  }

  // Convertir a patrones con frecuencia > 20%
  for (const [pair, data] of Object.entries(pairCounts)) {
    const frequency = (data.count / n) * 100;
    if (frequency >= 20) {
      patterns.push({
        competencies: pair.split("+"),
        frequency: Math.round(frequency),
        avgOutcome: mean(data.outcomes) || 0,
      });
    }
  }

  // Ordenar por frecuencia
  return patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
}

// =========================================================
// 🎯 FUNCIONES DE ANÁLISIS AVANZADO
// =========================================================

/**
 * Genera insights sobre qué caracteriza a los top performers
 */
export function generateTopPerformerInsights(
  profile: TopPerformerProfile
): string[] {
  const insights: string[] = [];

  if (!profile || profile.sampleSize < MIN_SAMPLE_SIZE) {
    return insights;
  }

  // Insight sobre competencias distintivas
  if (profile.topCompetencies.length > 0) {
    const top = profile.topCompetencies[0];
    if (top.diffFromAvg > 5) {
      insights.push(
        `top_competency:${top.key}:${top.diffFromAvg.toFixed(1)}`
      );
    }
  }

  // Insight sobre patrones
  if (profile.commonPatterns.length > 0) {
    const pattern = profile.commonPatterns[0];
    if (pattern.frequency >= 30) {
      insights.push(
        `pattern:${pattern.competencies.join("+")}:${pattern.frequency}`
      );
    }
  }

  // Insight sobre talentos
  if (profile.topTalents.length > 0) {
    const talent = profile.topTalents[0];
    if (talent.avgScore > 70) {
      insights.push(`talent:${talent.key}:${talent.avgScore.toFixed(1)}`);
    }
  }

  return insights;
}

/**
 * Calcula todos los perfiles de top performers para todos los outcomes
 */
export function calculateAllTopPerformerProfiles(
  dataPoints: any[],
  percentileThreshold: number = 90,
  filters: DataPointFilters = {}
): Record<string, TopPerformerProfile | null> {
  const profiles: Record<string, TopPerformerProfile | null> = {};

  for (const outcome of OUTCOMES) {
    profiles[outcome] = calculateTopPerformerProfile(
      dataPoints,
      outcome,
      percentileThreshold,
      filters
    );
  }

  return profiles;
}
