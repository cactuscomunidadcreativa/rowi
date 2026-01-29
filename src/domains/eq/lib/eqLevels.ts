/**
 * 🎯 EQ LEVELS — Basado en el modelo SEI (0–135)
 * Define niveles emocionales de desempeño y desarrollo personal.
 */

export interface EqLevel {
  key: string;
  labelKey: string;       // Clave de traducción para el nombre
  label: string;          // Fallback en español
  labelEN: string;        // Fallback en inglés
  short?: string;         // Versión corta opcional (Ej: FUN)
  min: number;
  max: number;
  color: string;
  emoji: string;
  descriptionKey: string; // Clave de traducción para descripción
  description: string;    // Fallback en español
  descriptionEN: string;  // Fallback en inglés
}

/**
 * 🧠 Escala oficial SEI (Six Seconds)
 * Indicadores de nivel de competencia emocional
 * - Desafío (65–81) / Challenge
 * - Emergente (82–91) / Emerging
 * - Funcional (92–107) / Functional
 * - Diestro (108–117) / Skilled
 * - Experto (118–135) / Expert
 */
export const EQ_LEVELS: EqLevel[] = [
  {
    key: "challenge",
    labelKey: "sei.levels.challenge",
    label: "Desafío",
    labelEN: "Challenge",
    short: "CH",
    min: 65,
    max: 81,
    color: "#ef4444",
    emoji: "🧩",
    descriptionKey: "sei.levels.challenge.desc",
    description: "Necesita desarrollar consciencia emocional y autogestión. Área de oportunidad significativa.",
    descriptionEN: "Needs to develop emotional awareness and self-management. Significant opportunity area.",
  },
  {
    key: "emerging",
    labelKey: "sei.levels.emerging",
    label: "Emergente",
    labelEN: "Emerging",
    short: "EM",
    min: 82,
    max: 91,
    color: "#f59e0b",
    emoji: "🌱",
    descriptionKey: "sei.levels.emerging.desc",
    description: "Comienza a reconocer emociones y usarlas de forma funcional. En proceso de desarrollo.",
    descriptionEN: "Beginning to recognize emotions and use them functionally. In development process.",
  },
  {
    key: "functional",
    labelKey: "sei.levels.functional",
    label: "Funcional",
    labelEN: "Functional",
    short: "FU",
    min: 92,
    max: 107,
    color: "#3b82f6",
    emoji: "🧠",
    descriptionKey: "sei.levels.functional.desc",
    description: "Integra pensamiento y emoción con equilibrio consistente. Competencia estable.",
    descriptionEN: "Integrates thinking and emotion with consistent balance. Stable competence.",
  },
  {
    key: "skilled",
    labelKey: "sei.levels.skilled",
    label: "Diestro",
    labelEN: "Skilled",
    short: "DI",
    min: 108,
    max: 117,
    color: "#8b5cf6",
    emoji: "🎯",
    descriptionKey: "sei.levels.skilled.desc",
    description: "Maneja con fluidez las competencias emocionales clave. Alto desempeño.",
    descriptionEN: "Fluently manages key emotional competencies. High performance.",
  },
  {
    key: "expert",
    labelKey: "sei.levels.expert",
    label: "Experto",
    labelEN: "Expert",
    short: "EX",
    min: 118,
    max: 135,
    color: "#10b981",
    emoji: "🌟",
    descriptionKey: "sei.levels.expert.desc",
    description: "Domina la inteligencia emocional con propósito y liderazgo. Nivel de excelencia.",
    descriptionEN: "Masters emotional intelligence with purpose and leadership. Level of excellence.",
  },
];

/** 🌈 Valor máximo absoluto SEI */
export const EQ_MAX = 135;

/** 🔢 Convierte score (0–135) → porcentaje */
export function toPercentOf135(score: number | null | undefined): number {
  if (typeof score !== "number" || isNaN(score)) return 0;
  const pct = (score / EQ_MAX) * 100;
  return Math.max(0, Math.min(100, parseFloat(pct.toFixed(2))));
}

/** 🧭 Devuelve el nivel SEI según el puntaje */
export function getEqLevel(score: number): EqLevel {
  return (
    EQ_LEVELS.find((lvl) => score >= lvl.min && score <= lvl.max) ||
    EQ_LEVELS[0]
  );
}

/** 🎨 Formatea una etiqueta visual estilo Rowi */
export function formatEqLevel(score: number): string {
  const lvl = getEqLevel(score);
  return `${lvl.emoji} ${lvl.label}`;
}