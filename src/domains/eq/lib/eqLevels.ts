/**
 * 🎯 EQ LEVELS — Basado en el modelo SEI (0–135)
 * Define niveles emocionales de desempeño y desarrollo personal.
 */

export interface EqLevel {
  key: string;
  label: string;       // Nombre descriptivo (Ej: Funcional)
  short?: string;      // Versión corta opcional (Ej: FUN)
  min: number;
  max: number;
  color: string;
  emoji: string;
  description: string;
}

/**
 * 🧠 Escala oficial SEI (Six Seconds)
 * - Desafío (0–81)
 * - Emergente (82–91)
 * - Funcional (92–107)
 * - Diestro (108–117)
 * - Experto (118–135)
 */
export const EQ_LEVELS: EqLevel[] = [
  {
    key: "challenge",
    label: "Desafío",
    short: "CH",
    min: 0,
    max: 81,
    color: "#ef4444",
    emoji: "🧩",
    description: "Necesita desarrollar consciencia emocional y autogestión.",
  },
  {
    key: "emerging",
    label: "Emergente",
    short: "EM",
    min: 82,
    max: 91,
    color: "#f59e0b",
    emoji: "🌱",
    description: "Comienza a reconocer emociones y usarlas de forma funcional.",
  },
  {
    key: "functional",
    label: "Funcional",
    short: "FU",
    min: 92,
    max: 107,
    color: "#3b82f6",
    emoji: "🧠",
    description: "Integra pensamiento y emoción con equilibrio consistente.",
  },
  {
    key: "skilled",
    label: "Diestro",
    short: "DI",
    min: 108,
    max: 117,
    color: "#8b5cf6",
    emoji: "🎯",
    description: "Maneja con fluidez las competencias emocionales clave.",
  },
  {
    key: "expert",
    label: "Experto",
    short: "EX",
    min: 118,
    max: 135,
    color: "#10b981",
    emoji: "🌟",
    description: "Domina la inteligencia emocional con propósito y liderazgo.",
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