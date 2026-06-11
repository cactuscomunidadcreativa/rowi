// src/services/avatar-evolution.ts
// ============================================================
// Servicio de Evolucion del Avatar - Sistema Dual de Niveles
// ============================================================

import { prisma } from "@/core/prisma";
import { AvatarStage, MilestoneType } from "@prisma/client";
import { triggerAvatarEvolved } from "@/lib/notifications/triggers";
import {
  calculateSixSecondsLevel,
  getSixSecondsLevelInfo,
} from "@/lib/eq/six-seconds-levels";
import {
  calculateEvolutionScore,
  calculateHatchProgress,
  calculateRowiLevel,
  canHatch,
  getAvatarStageFromScore,
  getAvatarStageInfo,
  getNextAvatarStage,
  calculateProgressToNextStage,
  getRowiLevelInfo,
} from "@/lib/eq/evolution-calculator";

/**
 * De donde sale el nivel base (eje "donde estoy") del avatar:
 * - "sei": SEI formal (EqSnapshot.overall4) — normado, definitivo.
 * - "mini_sei": mini-SEI (MiniSeiSnapshot.totalEq) — normado pero INDICATIVO.
 * - "none": sin evaluacion; nivel base por defecto del avatar.
 *
 * El protagonista del avatar es el Becoming (practica + reflexion diaria);
 * el nivel base solo define el ESTADIO de partida.
 */
export type BaseLevelSource = "sei" | "mini_sei" | "none";

interface BaseLevelResult {
  sixSecondsLevel: number;
  baseSource: BaseLevelSource;
}

/**
 * Resuelve el nivel base (eje "donde estoy") con cascada:
 * SEI formal (overall4) -> mini-SEI (totalEq, indicativo) -> avatar.sixSecondsLevel.
 *
 * No existe SEI formal para la mayoria de usuarios todavia: el mini-SEI normado
 * cubre ese hueco y se muestra como indicativo. Centralizado aqui para que
 * getEvolutionState / syncSeiLevel / checkAndEvolve compartan una sola verdad.
 */
async function resolveBaseLevel(
  userId: string,
  fallbackLevel: number
): Promise<BaseLevelResult> {
  // Los SEI importados por CSV/xlsx a veces traen solo email (sin userId):
  // buscar por ambos para que la lectura formal del usuario siempre se vea.
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  const seiWhere = u?.email
    ? {
        OR: [{ userId }, { email: { equals: u.email, mode: "insensitive" as const } }],
        overall4: { not: null },
      }
    : { userId, overall4: { not: null } };

  const [latestSei, latestMiniSei] = await Promise.all([
    prisma.eqSnapshot.findFirst({
      where: seiWhere,
      orderBy: { at: "desc" },
      select: { overall4: true },
    }),
    prisma.miniSeiSnapshot.findFirst({
      where: { userId },
      orderBy: { takenAt: "desc" },
      select: { totalEq: true },
    }),
  ]);

  if (latestSei?.overall4) {
    return {
      sixSecondsLevel: calculateSixSecondsLevel(latestSei.overall4),
      baseSource: "sei",
    };
  }

  if (latestMiniSei?.totalEq) {
    return {
      sixSecondsLevel: calculateSixSecondsLevel(latestMiniSei.totalEq),
      baseSource: "mini_sei",
    };
  }

  return { sixSecondsLevel: fallbackLevel, baseSource: "none" };
}

export interface EvolutionState {
  // Niveles
  rowiLevel: number;
  sixSecondsLevel: number;
  /** Origen del nivel base: "sei" (formal) | "mini_sei" (indicativo) | "none" */
  baseSource: BaseLevelSource;
  evolutionScore: number;

  // Avatar
  currentStage: AvatarStage;
  nextStage: AvatarStage | null;
  progressToNext: number;

  // Huevo
  hatchProgress: number;
  isHatched: boolean;
  canHatchNow: boolean;

  // Metadata traducible
  rowiLevelInfo: {
    name: { es: string; en: string };
    slug: string;
  };
  sixSecondsLevelInfo: {
    name: { es: string; en: string };
    emoji: string;
    color: string;
    slug: string;
  };
  stageInfo: {
    name: { es: string; en: string };
    description: { es: string; en: string };
    emoji: string;
  };

  // Stats
  totalXP: number;
  daysActive: number;
}

/**
 * Obtiene el estado completo de evolucion del usuario
 */
export async function getEvolutionState(userId: string): Promise<EvolutionState | null> {
  // Obtener avatar, nivel y racha de reflexion (la señal de Becoming)
  const [avatar, userLevel, streak] = await Promise.all([
    prisma.avatarEvolution.findUnique({ where: { userId } }),
    prisma.userLevel.findUnique({ where: { userId } }),
    prisma.userStreak.findUnique({
      where: { userId },
      select: { currentStreak: true },
    }),
  ]);

  if (!avatar) return null;

  // Calcular niveles
  const totalXP = userLevel?.totalPoints ?? 0;
  const rowiLevel = userLevel?.level ?? calculateRowiLevel(totalXP);
  const { sixSecondsLevel, baseSource } = await resolveBaseLevel(
    userId,
    avatar.sixSecondsLevel
  );

  // Calcular dias activos desde registro
  const daysActive = Math.floor(
    (Date.now() - avatar.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calcular progreso de eclosion — la reflexion diaria (streak) pesa más
  const hatchProgress = calculateHatchProgress(
    daysActive,
    totalXP,
    streak?.currentStreak ?? 0
  );

  // Calcular score de evolucion
  const evolutionScore = calculateEvolutionScore(rowiLevel, sixSecondsLevel);

  // Determinar stage actual
  const currentStage = avatar.hatched
    ? getAvatarStageFromScore(evolutionScore)
    : avatar.stage;

  const nextStage = getNextAvatarStage(currentStage);
  const progressToNext = calculateProgressToNextStage(evolutionScore, currentStage);

  // Info de niveles
  const rowiLevelInfo = getRowiLevelInfo(rowiLevel);
  const sixSecondsLevelInfo = getSixSecondsLevelInfo(sixSecondsLevel);
  const stageInfo = getAvatarStageInfo(currentStage);

  return {
    rowiLevel,
    sixSecondsLevel,
    baseSource,
    evolutionScore,
    currentStage,
    nextStage,
    progressToNext,
    hatchProgress,
    isHatched: avatar.hatched,
    canHatchNow: !avatar.hatched && canHatch(hatchProgress, rowiLevel),
    rowiLevelInfo: {
      name: rowiLevelInfo.name,
      slug: rowiLevelInfo.slug,
    },
    sixSecondsLevelInfo: {
      name: sixSecondsLevelInfo.name,
      emoji: sixSecondsLevelInfo.emoji,
      color: sixSecondsLevelInfo.color,
      slug: sixSecondsLevelInfo.slug,
    },
    stageInfo: {
      name: stageInfo.name,
      description: stageInfo.description,
      emoji: stageInfo.emoji,
    },
    totalXP,
    daysActive,
  };
}

/**
 * Sincroniza el nivel Six Seconds desde el ultimo EqSnapshot
 */
export async function syncSeiLevel(userId: string): Promise<{
  updated: boolean;
  oldLevel: number;
  newLevel: number;
}> {
  const avatar = await prisma.avatarEvolution.findUnique({ where: { userId } });

  if (!avatar) {
    return { updated: false, oldLevel: 1, newLevel: 1 };
  }

  const oldLevel = avatar.sixSecondsLevel;
  // Cascada SEI formal -> mini-SEI -> nivel actual (mismo origen que el avatar).
  const { sixSecondsLevel: newLevel } = await resolveBaseLevel(userId, oldLevel);

  if (newLevel !== oldLevel) {
    await prisma.avatarEvolution.update({
      where: { userId },
      data: {
        sixSecondsLevel: newLevel,
        lastSeiSync: new Date(),
      },
    });

    // Registrar milestone si subio de nivel
    if (newLevel > oldLevel) {
      await prisma.avatarMilestone.create({
        data: {
          avatarId: avatar.id,
          type: "SEI_LEVEL_UP",
          title: `Six Seconds Level ${newLevel}`,
          description: `Subio de nivel ${oldLevel} a ${newLevel}`,
          xpReward: 50,
          metadata: { oldLevel, newLevel },
        },
      });
    }

    return { updated: true, oldLevel, newLevel };
  }

  return { updated: false, oldLevel, newLevel };
}

/**
 * Actualiza el progreso de eclosion del huevo
 */
export async function updateHatchProgress(userId: string): Promise<{
  hatchProgress: number;
  canHatchNow: boolean;
}> {
  const [avatar, userLevel, streak] = await Promise.all([
    prisma.avatarEvolution.findUnique({ where: { userId } }),
    prisma.userLevel.findUnique({ where: { userId } }),
    prisma.userStreak.findUnique({
      where: { userId },
      select: { currentStreak: true },
    }),
  ]);

  if (!avatar || avatar.hatched) {
    return { hatchProgress: 100, canHatchNow: false };
  }

  const daysActive = Math.floor(
    (Date.now() - avatar.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalXP = userLevel?.totalPoints ?? 0;
  const rowiLevel = userLevel?.level ?? 1;

  const hatchProgress = calculateHatchProgress(
    daysActive,
    totalXP,
    streak?.currentStreak ?? 0
  );
  const canHatchNow = canHatch(hatchProgress, rowiLevel);

  // Actualizar en BD
  await prisma.avatarEvolution.update({
    where: { userId },
    data: {
      hatchProgress,
      daysActive,
    },
  });

  return { hatchProgress, canHatchNow };
}

/**
 * Verifica y aplica evolucion del avatar si corresponde
 */
export async function checkAndEvolve(userId: string): Promise<{
  evolved: boolean;
  hatched: boolean;
  previousStage: AvatarStage;
  newStage: AvatarStage;
  evolutionScore: number;
}> {
  const [avatar, userLevel, streak] = await Promise.all([
    prisma.avatarEvolution.findUnique({ where: { userId } }),
    prisma.userLevel.findUnique({ where: { userId } }),
    prisma.userStreak.findUnique({
      where: { userId },
      select: { currentStreak: true },
    }),
  ]);

  if (!avatar) {
    return {
      evolved: false,
      hatched: false,
      previousStage: "EGG",
      newStage: "EGG",
      evolutionScore: 0,
    };
  }

  const previousStage = avatar.stage;
  const totalXP = userLevel?.totalPoints ?? 0;
  const rowiLevel = userLevel?.level ?? calculateRowiLevel(totalXP);
  const { sixSecondsLevel } = await resolveBaseLevel(userId, avatar.sixSecondsLevel);

  // Calcular dias activos y hatch progress (la reflexion diaria pesa más)
  const daysActive = Math.floor(
    (Date.now() - avatar.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const hatchProgress = calculateHatchProgress(
    daysActive,
    totalXP,
    streak?.currentStreak ?? 0
  );

  // Verificar eclosion
  let hatched = avatar.hatched;
  if (!hatched && canHatch(hatchProgress, rowiLevel)) {
    hatched = true;

    // Registrar milestone de eclosion
    await prisma.avatarMilestone.create({
      data: {
        avatarId: avatar.id,
        type: "AVATAR_HATCHED",
        title: "Tu Rowi ha nacido!",
        description: "Tu huevito ha eclosionado",
        xpReward: 100,
        rarity: "rare",
      },
    });
  }

  // Calcular nuevo stage
  const evolutionScore = calculateEvolutionScore(rowiLevel, sixSecondsLevel);
  const newStage = hatched ? getAvatarStageFromScore(evolutionScore) : (hatchProgress >= 50 ? "HATCHING" : "EGG");

  const evolved = newStage !== previousStage;

  // Actualizar avatar
  await prisma.avatarEvolution.update({
    where: { userId },
    data: {
      stage: newStage,
      hatched,
      hatchProgress,
      daysActive,
      sixSecondsLevel,
      evolutionScore,
      lastEvolution: evolved ? new Date() : avatar.lastEvolution,
    },
  });

  // Registrar milestone de evolucion
  if (evolved && hatched) {
    const milestoneTypeMap: Record<AvatarStage, MilestoneType> = {
      EGG: "EGG_RECEIVED",
      HATCHING: "HATCHING_STARTED",
      BABY: "AVATAR_BABY",
      YOUNG: "AVATAR_YOUNG",
      ADULT: "AVATAR_ADULT",
      WISE: "AVATAR_WISE",
    };

    const stageInfo = getAvatarStageInfo(newStage);
    await prisma.avatarMilestone.create({
      data: {
        avatarId: avatar.id,
        type: milestoneTypeMap[newStage],
        title: `Evolucion: ${stageInfo.name.es}`,
        description: stageInfo.description.es,
        xpReward: newStage === "WISE" ? 200 : 75,
        rarity: newStage === "WISE" ? "legendary" : "uncommon",
      },
    });
  }

  // Notificación de evolución/eclosión — el trigger existía como dead code
  // (nadie lo llamaba); aquí cubre a TODOS los callers (today, daily-pulse).
  // Resiliente: un fallo de notificación no rompe la evolución.
  if (evolved || (hatched && !avatar.hatched)) {
    try {
      await triggerAvatarEvolved(userId, newStage, previousStage);
    } catch {
      /* noop */
    }
  }

  return {
    evolved,
    hatched,
    previousStage,
    newStage,
    evolutionScore,
  };
}

/**
 * Crea el avatar inicial para un usuario nuevo
 */
export async function createInitialAvatar(userId: string, brainStyle?: string): Promise<void> {
  const existing = await prisma.avatarEvolution.findUnique({ where: { userId } });

  if (existing) return;

  const avatar = await prisma.avatarEvolution.create({
    data: {
      userId,
      stage: "EGG",
      experience: 0,
      hatched: false,
      hatchProgress: 0,
      sixSecondsLevel: 1,
      evolutionScore: 0,
      daysActive: 0,
      brainStyle,
    },
  });

  // Registrar milestone de huevo recibido
  await prisma.avatarMilestone.create({
    data: {
      avatarId: avatar.id,
      type: "EGG_RECEIVED",
      title: "Recibiste tu huevito Rowi!",
      description: "Tu viaje emocional comienza aqui",
      xpReward: 10,
      rarity: "common",
    },
  });
}

/**
 * Agrega XP de experiencia al avatar (sincronizado con gamification)
 */
export async function addAvatarExperience(userId: string, xp: number): Promise<void> {
  await prisma.avatarEvolution.updateMany({
    where: { userId },
    data: {
      experience: { increment: xp },
    },
  });

  // Verificar evolucion despues de agregar XP
  await checkAndEvolve(userId);
}
