// src/lib/eq/evolution-calculator.ts
// ============================================================
// Calculador de evolucion del avatar Rowi
// ============================================================

import { AvatarStage } from "@prisma/client";

export interface RowiLevelInfo {
  level: number;
  slug: string;
  name: { es: string; en: string };
  minXP: number;
  maxXP: number;
}

/**
 * Niveles Rowi (engagement interno)
 * Basado en XP acumulado por actividad en la plataforma
 */
export const ROWI_LEVELS: RowiLevelInfo[] = [
  { level: 1, slug: "semilla", name: { es: "Semilla", en: "Seed" }, minXP: 0, maxXP: 99 },
  { level: 2, slug: "brote", name: { es: "Brote", en: "Sprout" }, minXP: 100, maxXP: 299 },
  { level: 3, slug: "planta", name: { es: "Planta", en: "Plant" }, minXP: 300, maxXP: 599 },
  { level: 4, slug: "arbol_joven", name: { es: "Arbol Joven", en: "Young Tree" }, minXP: 600, maxXP: 999 },
  { level: 5, slug: "arbol", name: { es: "Arbol", en: "Tree" }, minXP: 1000, maxXP: 1499 },
  { level: 6, slug: "arbol_fuerte", name: { es: "Arbol Fuerte", en: "Strong Tree" }, minXP: 1500, maxXP: 2199 },
  { level: 7, slug: "arbol_sabio", name: { es: "Arbol Sabio", en: "Wise Tree" }, minXP: 2200, maxXP: 2999 },
  { level: 8, slug: "bosque", name: { es: "Bosque", en: "Forest" }, minXP: 3000, maxXP: 3999 },
  { level: 9, slug: "guardian", name: { es: "Guardian", en: "Guardian" }, minXP: 4000, maxXP: 5499 },
  { level: 10, slug: "ancestro", name: { es: "Ancestro", en: "Ancestor" }, minXP: 5500, maxXP: Infinity },
];

export interface AvatarStageInfo {
  stage: AvatarStage;
  name: { es: string; en: string };
  description: { es: string; en: string };
  minScore: number;
  emoji: string;
}

/**
 * Etapas de evolucion del avatar
 * El score se calcula: (rowiLevel * 0.6) + (sixSecondsLevel * 0.4)
 */
export const AVATAR_STAGES: AvatarStageInfo[] = [
  {
    stage: "EGG",
    name: { es: "Huevito", en: "Egg" },
    description: { es: "Tu Rowi esta incubando", en: "Your Rowi is incubating" },
    minScore: 0,
    emoji: "🥚",
  },
  {
    stage: "HATCHING",
    name: { es: "Eclosionando", en: "Hatching" },
    description: { es: "El huevo esta comenzando a abrirse", en: "The egg is starting to crack" },
    minScore: 1.5,
    emoji: "🐣",
  },
  {
    stage: "BABY",
    name: { es: "Bebe", en: "Baby" },
    description: { es: "Tu Rowi bebe recien nacido", en: "Your newborn baby Rowi" },
    minScore: 3.0,
    emoji: "🐥",
  },
  {
    stage: "YOUNG",
    name: { es: "Joven", en: "Young" },
    description: { es: "Tu Rowi joven y curioso", en: "Your young and curious Rowi" },
    minScore: 5.0,
    emoji: "🦉",
  },
  {
    stage: "ADULT",
    name: { es: "Adulto", en: "Adult" },
    description: { es: "Tu Rowi adulto y equilibrado", en: "Your adult and balanced Rowi" },
    minScore: 7.0,
    emoji: "🦅",
  },
  {
    stage: "WISE",
    name: { es: "Sabio", en: "Wise" },
    description: { es: "Tu Rowi sabio y maestro", en: "Your wise master Rowi" },
    minScore: 9.0,
    emoji: "🪶",
  },
];

/**
 * Calcula el nivel Rowi basado en XP total
 */
export function calculateRowiLevel(totalXP: number): number {
  for (let i = ROWI_LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= ROWI_LEVELS[i].minXP) {
      return ROWI_LEVELS[i].level;
    }
  }
  return 1;
}

/**
 * Obtiene la informacion del nivel Rowi
 */
export function getRowiLevelInfo(level: number): RowiLevelInfo {
  return ROWI_LEVELS.find((l) => l.level === level) || ROWI_LEVELS[0];
}

/**
 * Calcula el score de evolucion combinando ambos niveles
 * Formula: (rowiLevel * 0.6) + (sixSecondsLevel * 0.4)
 */
export function calculateEvolutionScore(rowiLevel: number, sixSecondsLevel: number): number {
  return rowiLevel * 0.6 + sixSecondsLevel * 0.4;
}

/**
 * Determina el stage del avatar basado en el score de evolucion
 */
export function getAvatarStageFromScore(score: number): AvatarStage {
  // Recorremos de mayor a menor para encontrar el stage correcto
  for (let i = AVATAR_STAGES.length - 1; i >= 0; i--) {
    if (score >= AVATAR_STAGES[i].minScore) {
      return AVATAR_STAGES[i].stage;
    }
  }
  return "EGG";
}

/**
 * Obtiene la informacion del stage actual
 */
export function getAvatarStageInfo(stage: AvatarStage): AvatarStageInfo {
  return AVATAR_STAGES.find((s) => s.stage === stage) || AVATAR_STAGES[0];
}

/**
 * Obtiene el siguiente stage posible
 */
export function getNextAvatarStage(currentStage: AvatarStage): AvatarStage | null {
  const currentIndex = AVATAR_STAGES.findIndex((s) => s.stage === currentStage);
  if (currentIndex === -1 || currentIndex >= AVATAR_STAGES.length - 1) {
    return null;
  }
  return AVATAR_STAGES[currentIndex + 1].stage;
}

/**
 * Calcula el progreso hacia el siguiente nivel (0-100)
 */
export function calculateProgressToNextStage(score: number, currentStage: AvatarStage): number {
  const currentStageInfo = getAvatarStageInfo(currentStage);
  const nextStage = getNextAvatarStage(currentStage);

  if (!nextStage) return 100; // Ya esta en el maximo

  const nextStageInfo = getAvatarStageInfo(nextStage);
  const range = nextStageInfo.minScore - currentStageInfo.minScore;
  const progress = score - currentStageInfo.minScore;

  return Math.min(100, Math.round((progress / range) * 100));
}

/**
 * Calcula el progreso de eclosion del huevo
 * Base: 1% por dia de antiguedad
 * Bonus: 0.5% por cada actividad (punto ganado)
 */
export function calculateHatchProgress(daysActive: number, totalActivities: number): number {
  const baseProgress = daysActive;
  const activityBonus = Math.floor(totalActivities * 0.5);
  return Math.min(100, baseProgress + activityBonus);
}

/**
 * Verifica si el huevo puede eclosionar
 * Requisitos: hatchProgress >= 100 Y rowiLevel >= 2
 */
export function canHatch(hatchProgress: number, rowiLevel: number): boolean {
  return hatchProgress >= 100 && rowiLevel >= 2;
}
