// src/services/avatar-evolution.ts
// ============================================================
// Servicio de Evolucion del Avatar - Sistema Dual de Niveles
// ============================================================

import { prisma } from "@/core/prisma";
import { AvatarStage, MilestoneType } from "@prisma/client";
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

export interface EvolutionState {
  // Niveles
  rowiLevel: number;
  sixSecondsLevel: number;
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
  // Obtener avatar, nivel y ultimo SEI snapshot
  const [avatar, userLevel, latestSei] = await Promise.all([
    prisma.avatarEvolution.findUnique({ where: { userId } }),
    prisma.userLevel.findUnique({ where: { userId } }),
    prisma.eqSnapshot.findFirst({
      where: { userId },
      orderBy: { at: "desc" },
    }),
  ]);

  if (!avatar) return null;

  // Calcular niveles
  const totalXP = userLevel?.totalPoints ?? 0;
  const rowiLevel = userLevel?.level ?? calculateRowiLevel(totalXP);
  const sixSecondsLevel = latestSei?.overall4
    ? calculateSixSecondsLevel(latestSei.overall4)
    : avatar.sixSecondsLevel;

  // Calcular dias activos desde registro
  const daysActive = Math.floor(
    (Date.now() - avatar.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calcular progreso de eclosion
  const hatchProgress = calculateHatchProgress(daysActive, totalXP);

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
  const [avatar, latestSei] = await Promise.all([
    prisma.avatarEvolution.findUnique({ where: { userId } }),
    prisma.eqSnapshot.findFirst({
      where: { userId },
      orderBy: { at: "desc" },
    }),
  ]);

  if (!avatar) {
    return { updated: false, oldLevel: 1, newLevel: 1 };
  }

  const oldLevel = avatar.sixSecondsLevel;
  const newLevel = latestSei?.overall4
    ? calculateSixSecondsLevel(latestSei.overall4)
    : oldLevel;

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
  const [avatar, userLevel] = await Promise.all([
    prisma.avatarEvolution.findUnique({ where: { userId } }),
    prisma.userLevel.findUnique({ where: { userId } }),
  ]);

  if (!avatar || avatar.hatched) {
    return { hatchProgress: 100, canHatchNow: false };
  }

  const daysActive = Math.floor(
    (Date.now() - avatar.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalXP = userLevel?.totalPoints ?? 0;
  const rowiLevel = userLevel?.level ?? 1;

  const hatchProgress = calculateHatchProgress(daysActive, totalXP);
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
  const [avatar, userLevel, latestSei] = await Promise.all([
    prisma.avatarEvolution.findUnique({ where: { userId } }),
    prisma.userLevel.findUnique({ where: { userId } }),
    prisma.eqSnapshot.findFirst({
      where: { userId },
      orderBy: { at: "desc" },
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
  const sixSecondsLevel = latestSei?.overall4
    ? calculateSixSecondsLevel(latestSei.overall4)
    : avatar.sixSecondsLevel;

  // Calcular dias activos y hatch progress
  const daysActive = Math.floor(
    (Date.now() - avatar.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const hatchProgress = calculateHatchProgress(daysActive, totalXP);

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
