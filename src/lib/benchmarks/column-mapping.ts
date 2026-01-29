/**
 * 📋 BENCHMARK COLUMN MAPPING
 * Mapeo de columnas del Excel SOH a campos del modelo
 */

// =========================================================
// 🗺️ MAPEO DE COLUMNAS SOH → BENCHMARK DATA POINT
// =========================================================

export const SOH_COLUMN_MAPPING: Record<string, string> = {
  // Demográficos
  Country: "country",
  Countries: "country",
  Regions: "region",
  "Job Function": "jobFunction",
  "Job Role": "jobRole",
  Sector: "sector",
  Age: "ageRange",
  "Age (new)": "ageRange",
  Gender: "gender",
  Education: "education",
  Generations: "generation",

  // Core EQ (Know/Choose/Give) - múltiples variantes
  "Know Yourself Score": "K",
  "Know Yourself Score.1": "K",
  "Choose Yourself Score": "C",
  "Choose Yourself Score.1": "C",
  "Give Yourself Score": "G",
  "Give Yourself Score.1": "G",
  "Emotional Intelligence Score": "eqTotal",
  "Overall EQ": "eqTotal",

  // 8 Competencias Six Seconds (con "Score" al final)
  "Enhance Emotional Literacy Score": "EL",
  "Enhance Emotional Literacy": "EL",
  "Recognize Patterns Score": "RP",
  "Recognize Patterns": "RP",
  "Apply Consequential Thinking Score": "ACT",
  "Apply Consequential Thinking": "ACT",
  "Navigate Emotions Score": "NE",
  "Navigate Emotions": "NE",
  "Engage Intrinsic Motivation Score": "IM",
  "Engage Intrinsic Motivation": "IM",
  "Excercise Optimism Score": "OP", // Typo en el original
  "Exercise Optimism Score": "OP",
  "Exercise Optimism": "OP",
  "Increase Empathy Score": "EMP",
  "Increase Empathy": "EMP",
  "Pursue Noble Goals Score": "NG",
  "Pursue Noble Goals": "NG",

  // Outcomes (sin "Score")
  Effectiveness: "effectiveness",
  Relationship: "relationships",
  "Quality of Life": "qualityOfLife",
  Wellbeing: "wellbeing",
  Influence: "influence",
  "Decision Making": "decisionMaking",
  Community: "community",
  Network: "network",
  Networking: "network",
  Achievement: "achievement",
  Satisfaction: "satisfaction",
  Balance: "balance",
  "Work Life Balance": "balance",
  Health: "health",

  // Brain Talents (18 talentos)
  DataMining: "dataMining",
  Modeling: "modeling",
  Prioritizing: "prioritizing",
  Connection: "connection",
  EmotionalInsight: "emotionalInsight",
  Collaboration: "collaboration",
  Reflecting: "reflecting",
  Adaptability: "adaptability",
  CriticalThinking: "criticalThinking",
  Resilience: "resilience",
  RiskTolerance: "riskTolerance",
  Imagination: "imagination",
  Proactivity: "proactivity",
  Commitment: "commitment",
  ProblemSolving: "problemSolving",
  "Problem Solving": "problemSolving",
  Vision: "vision",
  Designing: "designing",
  Entrepreneurship: "entrepreneurship",
  "Brain Agility": "brainAgility",

  // Profile & Reliability
  Profile: "profile",
  "Reliability Index": "reliabilityIndex",

  // Otros scores útiles
  "Compassion Score": "compassion",
  "Dedication Score": "dedication",
  "Energy Score": "energy",
  "Integrity Score": "integrity",
};

// Columnas numéricas (métricas)
export const NUMERIC_COLUMNS = [
  "K",
  "C",
  "G",
  "eqTotal",
  "EL",
  "RP",
  "ACT",
  "NE",
  "IM",
  "OP",
  "EMP",
  "NG",
  "effectiveness",
  "relationships",
  "qualityOfLife",
  "wellbeing",
  "influence",
  "decisionMaking",
  "community",
  "network",
  "achievement",
  "satisfaction",
  "balance",
  "health",
  // Brain Talents (18)
  "dataMining",
  "modeling",
  "prioritizing",
  "connection",
  "emotionalInsight",
  "collaboration",
  "reflecting",
  "adaptability",
  "criticalThinking",
  "resilience",
  "riskTolerance",
  "imagination",
  "proactivity",
  "commitment",
  "problemSolving",
  "vision",
  "designing",
  "entrepreneurship",
  "brainAgility",
  "reliabilityIndex",
];

// Competencias EQ (para análisis de top performers)
export const EQ_COMPETENCIES = ["K", "C", "G", "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

// Outcomes (para análisis de correlación y top performers)
export const OUTCOMES = [
  "effectiveness",
  "relationships",
  "qualityOfLife",
  "wellbeing",
  "influence",
  "decisionMaking",
  "community",
  "network",
  "achievement",
  "satisfaction",
  "balance",
  "health",
];

// Brain Talents (18 talentos del modelo Six Seconds)
export const BRAIN_TALENTS = [
  "dataMining",
  "modeling",
  "prioritizing",
  "connection",
  "emotionalInsight",
  "collaboration",
  "reflecting",
  "adaptability",
  "criticalThinking",
  "resilience",
  "riskTolerance",
  "imagination",
  "proactivity",
  "commitment",
  "problemSolving",
  "vision",
  "designing",
  "entrepreneurship",
];

// Columnas demográficas
export const DEMOGRAPHIC_COLUMNS = [
  "country",
  "region",
  "jobFunction",
  "jobRole",
  "sector",
  "ageRange",
  "gender",
  "education",
];

// =========================================================
// 🔄 FUNCIONES DE TRANSFORMACIÓN
// =========================================================

/**
 * Transforma una fila del Excel a un objeto de data point
 */
export function transformRowToDataPoint(
  row: Record<string, any>,
  headers: string[]
): Record<string, any> {
  const dataPoint: Record<string, any> = {};

  headers.forEach((header, index) => {
    const mappedKey = SOH_COLUMN_MAPPING[header];
    if (mappedKey) {
      const value = row[index] || row[header];

      // Convertir a número si es una columna numérica
      if (NUMERIC_COLUMNS.includes(mappedKey)) {
        const num = parseFloat(value);
        dataPoint[mappedKey] = isNaN(num) ? null : num;
      } else {
        dataPoint[mappedKey] = value || null;
      }
    }
  });

  return dataPoint;
}

/**
 * Normaliza el valor de país para consistencia
 */
export function normalizeCountry(country: string | null): string | null {
  if (!country) return null;
  return country.trim();
}

/**
 * Normaliza el rango de edad
 */
export function normalizeAgeRange(age: string | null): string | null {
  if (!age) return null;
  const ageStr = age.toString().trim().toLowerCase();

  // Mapeo de formatos comunes
  if (ageStr.includes("under") || ageStr.includes("<") || ageStr.includes("18-29") || ageStr.includes("20-29")) {
    return "under30";
  }
  if (ageStr.includes("30-39") || ageStr.includes("30-40")) {
    return "30to40";
  }
  if (ageStr.includes("40-49") || ageStr.includes("40-50")) {
    return "40to50";
  }
  if (ageStr.includes("50") || ageStr.includes("over") || ageStr.includes(">")) {
    return "over50";
  }

  return age;
}

/**
 * Detecta la generación basada en la edad
 */
export function detectGeneration(ageRange: string | null): string | null {
  if (!ageRange) return null;

  switch (ageRange) {
    case "under30":
      return "genZ";
    case "30to40":
      return "millennials";
    case "40to50":
      return "genX";
    case "over50":
      return "boomers";
    default:
      return null;
  }
}

// =========================================================
// 📊 NOMBRES LEGIBLES PARA MÉTRICAS (I18N KEYS)
// =========================================================

export const METRIC_I18N_KEYS: Record<string, string> = {
  K: "admin.benchmarks.metrics.K",
  C: "admin.benchmarks.metrics.C",
  G: "admin.benchmarks.metrics.G",
  eqTotal: "admin.benchmarks.metrics.eqTotal",
  EL: "admin.benchmarks.metrics.EL",
  RP: "admin.benchmarks.metrics.RP",
  ACT: "admin.benchmarks.metrics.ACT",
  NE: "admin.benchmarks.metrics.NE",
  IM: "admin.benchmarks.metrics.IM",
  OP: "admin.benchmarks.metrics.OP",
  EMP: "admin.benchmarks.metrics.EMP",
  NG: "admin.benchmarks.metrics.NG",
  effectiveness: "admin.benchmarks.outcomes.effectiveness",
  relationships: "admin.benchmarks.outcomes.relationships",
  qualityOfLife: "admin.benchmarks.outcomes.qualityOfLife",
  wellbeing: "admin.benchmarks.outcomes.wellbeing",
  influence: "admin.benchmarks.outcomes.influence",
  decisionMaking: "admin.benchmarks.outcomes.decisionMaking",
  community: "admin.benchmarks.outcomes.community",
  network: "admin.benchmarks.outcomes.network",
  achievement: "admin.benchmarks.outcomes.achievement",
  satisfaction: "admin.benchmarks.outcomes.satisfaction",
  balance: "admin.benchmarks.outcomes.balance",
  health: "admin.benchmarks.outcomes.health",
  // Brain Talents (18)
  dataMining: "admin.benchmarks.talents.dataMining",
  modeling: "admin.benchmarks.talents.modeling",
  prioritizing: "admin.benchmarks.talents.prioritizing",
  connection: "admin.benchmarks.talents.connection",
  emotionalInsight: "admin.benchmarks.talents.emotionalInsight",
  collaboration: "admin.benchmarks.talents.collaboration",
  reflecting: "admin.benchmarks.talents.reflecting",
  adaptability: "admin.benchmarks.talents.adaptability",
  criticalThinking: "admin.benchmarks.talents.criticalThinking",
  resilience: "admin.benchmarks.talents.resilience",
  riskTolerance: "admin.benchmarks.talents.riskTolerance",
  imagination: "admin.benchmarks.talents.imagination",
  proactivity: "admin.benchmarks.talents.proactivity",
  commitment: "admin.benchmarks.talents.commitment",
  problemSolving: "admin.benchmarks.talents.problemSolving",
  vision: "admin.benchmarks.talents.vision",
  designing: "admin.benchmarks.talents.designing",
  entrepreneurship: "admin.benchmarks.talents.entrepreneurship",
};

export const OUTCOME_I18N_KEYS: Record<string, string> = {
  effectiveness: "admin.benchmarks.outcomes.effectiveness",
  relationships: "admin.benchmarks.outcomes.relationships",
  qualityOfLife: "admin.benchmarks.outcomes.qualityOfLife",
  wellbeing: "admin.benchmarks.outcomes.wellbeing",
  influence: "admin.benchmarks.outcomes.influence",
  decisionMaking: "admin.benchmarks.outcomes.decisionMaking",
  community: "admin.benchmarks.outcomes.community",
  network: "admin.benchmarks.outcomes.network",
  achievement: "admin.benchmarks.outcomes.achievement",
  satisfaction: "admin.benchmarks.outcomes.satisfaction",
  balance: "admin.benchmarks.outcomes.balance",
  health: "admin.benchmarks.outcomes.health",
};
