// src/lib/eq/six-seconds-levels.ts
// ============================================================
// Mapeo de niveles Six Seconds EQ basado en SEI overall4
// ============================================================

export interface SixSecondsLevel {
  level: number;
  slug: string;
  name: { es: string; en: string };
  description: { es: string; en: string };
  emoji: string;
  color: string;
  minScore: number;
  maxScore: number;
  emotionsCount: number;
}

/**
 * Niveles Six Seconds basados en el SEI (Six Seconds Emotional Intelligence Assessment)
 * Rango overall4: 65-135
 */
export const SIX_SECONDS_LEVELS: SixSecondsLevel[] = [
  {
    level: 1,
    slug: "desafio",
    name: { es: "Desafio", en: "Challenge" },
    description: {
      es: "Necesita desarrollar consciencia emocional",
      en: "Needs to develop emotional awareness",
    },
    emoji: "🧩",
    color: "#ef4444", // red-500
    minScore: 0,
    maxScore: 81,
    emotionsCount: 8,
  },
  {
    level: 2,
    slug: "emergente",
    name: { es: "Emergente", en: "Emerging" },
    description: {
      es: "Comienza a reconocer emociones y usarlas funcionalmente",
      en: "Starting to recognize emotions and use them functionally",
    },
    emoji: "🌱",
    color: "#f59e0b", // amber-500
    minScore: 82,
    maxScore: 91,
    emotionsCount: 24,
  },
  {
    level: 3,
    slug: "funcional",
    name: { es: "Funcional", en: "Functional" },
    description: {
      es: "Integra pensamiento y emocion con equilibrio consistente",
      en: "Integrates thought and emotion with consistent balance",
    },
    emoji: "🧠",
    color: "#3b82f6", // blue-500
    minScore: 92,
    maxScore: 107,
    emotionsCount: 48,
  },
  {
    level: 4,
    slug: "diestro",
    name: { es: "Diestro", en: "Skilled" },
    description: {
      es: "Maneja con fluidez las competencias emocionales clave",
      en: "Fluently manages key emotional competencies",
    },
    emoji: "🎯",
    color: "#8b5cf6", // violet-500
    minScore: 108,
    maxScore: 117,
    emotionsCount: 80,
  },
  {
    level: 5,
    slug: "experto",
    name: { es: "Experto", en: "Expert" },
    description: {
      es: "Domina la inteligencia emocional con proposito y liderazgo",
      en: "Masters emotional intelligence with purpose and leadership",
    },
    emoji: "🌟",
    color: "#10b981", // emerald-500
    minScore: 118,
    maxScore: 135,
    emotionsCount: 130,
  },
];

/**
 * Calcula el nivel Six Seconds basado en el score overall4 del SEI
 * @param overall4 - Score del SEI (0-135)
 * @returns Nivel 1-5
 */
export function calculateSixSecondsLevel(overall4: number | null | undefined): number {
  if (!overall4 || overall4 <= 0) return 1;

  for (const level of SIX_SECONDS_LEVELS) {
    if (overall4 >= level.minScore && overall4 <= level.maxScore) {
      return level.level;
    }
  }

  // Si es mayor a 135, es experto
  if (overall4 > 135) return 5;

  return 1;
}

/**
 * Obtiene la definicion completa del nivel
 */
export function getSixSecondsLevelInfo(level: number): SixSecondsLevel {
  return SIX_SECONDS_LEVELS.find((l) => l.level === level) || SIX_SECONDS_LEVELS[0];
}

/**
 * Obtiene el nombre del nivel en el idioma especificado
 */
export function getSixSecondsLevelName(level: number, lang: "es" | "en" = "es"): string {
  const info = getSixSecondsLevelInfo(level);
  return info.name[lang];
}

/**
 * Obtiene el numero de emociones disponibles para un nivel
 */
export function getEmotionsCountForLevel(level: number): number {
  const info = getSixSecondsLevelInfo(level);
  return info.emotionsCount;
}
