// src/services/gamification.ts
// ============================================================
// Servicio de Gamificación - Lógica centralizada para puntos y achievements
// ============================================================

import { prisma } from "@/core/prisma";
import { PointReason, AchievementCategory } from "@prisma/client";
import { checkAndEvolve, addAvatarExperience } from "@/services/avatar-evolution";

interface AwardPointsOptions {
  userId: string;
  amount: number;
  reason: PointReason;
  reasonId?: string;
  description?: string;
}

interface CheckAchievementOptions {
  userId: string;
  category?: AchievementCategory;
}

// Multiplicadores de racha
const STREAK_MULTIPLIERS = [
  { minDays: 1, multiplier: 1.0 },
  { minDays: 3, multiplier: 1.1 },
  { minDays: 7, multiplier: 1.25 },
  { minDays: 14, multiplier: 1.5 },
  { minDays: 30, multiplier: 2.0 },
  { minDays: 60, multiplier: 2.5 },
  { minDays: 90, multiplier: 3.0 },
];

/**
 * Obtener multiplicador de racha basado en días consecutivos
 */
function getStreakMultiplier(streakDays: number): number {
  let multiplier = 1.0;
  for (const tier of STREAK_MULTIPLIERS) {
    if (streakDays >= tier.minDays) {
      multiplier = tier.multiplier;
    }
  }
  return multiplier;
}

/**
 * Otorgar puntos a un usuario
 */
export async function awardPoints(options: AwardPointsOptions): Promise<{
  pointsAwarded: number;
  totalPoints: number;
  streakMultiplier: number;
  leveledUp: boolean;
  newLevel?: number;
}> {
  const { userId, amount, reason, reasonId, description } = options;

  // Obtener nivel actual y racha
  const [userLevel, userStreak] = await Promise.all([
    prisma.userLevel.findUnique({ where: { userId } }),
    prisma.userStreak.findUnique({ where: { userId } }),
  ]);

  // Crear nivel si no existe
  let level = userLevel;
  if (!level) {
    level = await prisma.userLevel.create({
      data: {
        userId,
        level: 1,
        totalPoints: 0,
        pointsToNextLevel: 100,
        title: "Explorador Emocional",
        titleEN: "Emotional Explorer",
      },
    });
  }

  // Crear racha si no existe
  let streak = userStreak;
  if (!streak) {
    streak = await prisma.userStreak.create({
      data: {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        multiplier: 1.0,
      },
    });
  }

  // Calcular multiplicador total (nivel + racha)
  const levelDef = await prisma.levelDefinition.findFirst({
    where: { level: level.level },
  });
  const levelMultiplier = levelDef?.multiplier || 1.0;
  const streakMultiplier = getStreakMultiplier(streak.currentStreak);
  const totalMultiplier = levelMultiplier * streakMultiplier;

  // Calcular puntos finales
  const finalPoints = Math.round(amount * totalMultiplier);
  const newTotalPoints = level.totalPoints + finalPoints;

  // Verificar si sube de nivel
  const nextLevelDef = await prisma.levelDefinition.findFirst({
    where: { level: level.level + 1 },
  });

  let leveledUp = false;
  let newLevel = level.level;

  if (nextLevelDef && newTotalPoints >= nextLevelDef.minPoints) {
    leveledUp = true;
    newLevel = nextLevelDef.level;
  }

  // Actualizar en transacción
  await prisma.$transaction([
    // Registrar puntos
    prisma.userPoints.create({
      data: {
        userId,
        amount: finalPoints,
        balance: newTotalPoints,
        reason,
        reasonId,
        description: description || `${reason}: +${finalPoints} pts`,
        multiplier: totalMultiplier,
      },
    }),
    // Actualizar nivel
    prisma.userLevel.update({
      where: { userId },
      data: {
        totalPoints: newTotalPoints,
        level: newLevel,
        ...(leveledUp && nextLevelDef
          ? {
              title: nextLevelDef.title,
              titleEN: nextLevelDef.titleEN,
              pointsToNextLevel: nextLevelDef.maxPoints || null,
            }
          : {}),
      },
    }),
  ]);

  return {
    pointsAwarded: finalPoints,
    totalPoints: newTotalPoints,
    streakMultiplier,
    leveledUp,
    newLevel: leveledUp ? newLevel : undefined,
  };
}

/**
 * Actualizar racha de usuario (llamar cuando hay actividad diaria)
 */
export async function updateStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  multiplier: number;
  continued: boolean;
}> {
  const streak = await prisma.userStreak.findUnique({ where: { userId } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!streak) {
    const newStreak = await prisma.userStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
        multiplier: 1.0,
      },
    });
    return {
      currentStreak: 1,
      longestStreak: 1,
      multiplier: 1.0,
      continued: false,
    };
  }

  const lastActivity = streak.lastActivityDate
    ? new Date(streak.lastActivityDate)
    : null;

  if (lastActivity) {
    lastActivity.setHours(0, 0, 0, 0);
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let newCurrentStreak = streak.currentStreak;
  let continued = false;

  if (lastActivity?.getTime() === today.getTime()) {
    // Ya registró actividad hoy, no cambiar nada
    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      multiplier: streak.multiplier,
      continued: true,
    };
  } else if (lastActivity?.getTime() === yesterday.getTime()) {
    // Continuó la racha
    newCurrentStreak = streak.currentStreak + 1;
    continued = true;
  } else {
    // Perdió la racha
    newCurrentStreak = 1;
    continued = false;
  }

  const newLongestStreak = Math.max(newCurrentStreak, streak.longestStreak);
  const newMultiplier = getStreakMultiplier(newCurrentStreak);

  await prisma.userStreak.update({
    where: { userId },
    data: {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: today,
      multiplier: newMultiplier,
    },
  });

  return {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    multiplier: newMultiplier,
    continued,
  };
}

/**
 * Verificar y otorgar achievements automáticamente
 */
export async function checkAndAwardAchievements(
  options: CheckAchievementOptions
): Promise<Array<{ slug: string; name: string; points: number }>> {
  const { userId, category } = options;
  const awardedAchievements: Array<{ slug: string; name: string; points: number }> = [];

  // Obtener datos del usuario para verificar condiciones
  const [
    userLevel,
    userStreak,
    chatCount,
    microlearningCount,
    completedAchievements,
  ] = await Promise.all([
    prisma.userLevel.findUnique({ where: { userId } }),
    prisma.userStreak.findUnique({ where: { userId } }),
    prisma.rowiChat.count({ where: { userId } }),
    prisma.userMicroLearning.count({ where: { userId, status: "COMPLETED" } }),
    prisma.userAchievement.findMany({
      where: { userId, completed: true },
      select: { achievementId: true },
    }),
  ]);

  const completedIds = new Set(completedAchievements.map((a) => a.achievementId));

  // Obtener achievements a verificar
  const achievementsToCheck = await prisma.achievement.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
    },
  });

  for (const achievement of achievementsToCheck) {
    if (completedIds.has(achievement.id)) continue;

    let shouldAward = false;
    const conditions = achievement.conditions as any;

    if (!conditions) continue;

    // Verificar condiciones según tipo
    switch (achievement.category) {
      case "CHAT":
        if (conditions.minChats && chatCount >= conditions.minChats) {
          shouldAward = true;
        }
        break;

      case "STREAK":
        if (conditions.minStreak && userStreak && userStreak.currentStreak >= conditions.minStreak) {
          shouldAward = true;
        }
        if (conditions.minLongestStreak && userStreak && userStreak.longestStreak >= conditions.minLongestStreak) {
          shouldAward = true;
        }
        break;

      case "LEARNING":
        if (conditions.minMicrolearnings && microlearningCount >= conditions.minMicrolearnings) {
          shouldAward = true;
        }
        break;

      case "GENERAL":
        if (conditions.minLevel && userLevel && userLevel.level >= conditions.minLevel) {
          shouldAward = true;
        }
        if (conditions.minPoints && userLevel && userLevel.totalPoints >= conditions.minPoints) {
          shouldAward = true;
        }
        break;
    }

    if (shouldAward) {
      // Otorgar achievement
      await prisma.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
        create: {
          userId,
          achievementId: achievement.id,
          completed: true,
          progress: 100,
          completedAt: new Date(),
        },
        update: {
          completed: true,
          progress: 100,
          completedAt: new Date(),
        },
      });

      // Otorgar puntos del achievement
      if (achievement.points > 0) {
        await awardPoints({
          userId,
          amount: achievement.points,
          reason: "ACHIEVEMENT",
          reasonId: achievement.id,
          description: `Achievement: ${achievement.name}`,
        });
      }

      awardedAchievements.push({
        slug: achievement.slug,
        name: achievement.name,
        points: achievement.points,
      });
    }
  }

  return awardedAchievements;
}

/**
 * Registrar actividad y actualizar gamificación (helper completo)
 */
export async function recordActivity(
  userId: string,
  activityType: "CHAT" | "MICROLEARNING" | "EQ_CHECKIN" | "DAILY_LOGIN",
  options?: {
    points?: number;
    reasonId?: string;
    description?: string;
  }
): Promise<{
  pointsAwarded: number;
  streakUpdated: boolean;
  newAchievements: Array<{ slug: string; name: string; points: number }>;
  leveledUp: boolean;
}> {
  // Actualizar racha
  const streakResult = await updateStreak(userId);

  // Puntos base por tipo de actividad
  const basePoints: Record<string, number> = {
    CHAT: 10,
    MICROLEARNING: 25,
    EQ_CHECKIN: 15,
    DAILY_LOGIN: 5,
  };

  const points = options?.points ?? basePoints[activityType] ?? 10;

  // Mapear a PointReason del schema
  const reasonMap: Record<string, PointReason> = {
    CHAT: "CHAT_SESSION",
    MICROLEARNING: "MICROLEARNING",
    EQ_CHECKIN: "COMMUNITY_CONTRIBUTION",
    DAILY_LOGIN: "DAILY_CHECKIN",
  };

  // Otorgar puntos
  const pointsResult = await awardPoints({
    userId,
    amount: points,
    reason: reasonMap[activityType] || "ADMIN_GRANT",
    reasonId: options?.reasonId,
    description: options?.description,
  });

  // Verificar achievements
  const categoryMap: Record<string, AchievementCategory> = {
    CHAT: "CHAT",
    MICROLEARNING: "LEARNING",
    EQ_CHECKIN: "EQ",
    DAILY_LOGIN: "STREAK",
  };

  const newAchievements = await checkAndAwardAchievements({
    userId,
    category: categoryMap[activityType],
  });

  // También verificar achievements generales
  const generalAchievements = await checkAndAwardAchievements({
    userId,
    category: "GENERAL",
  });

  // Actualizar evolucion del avatar
  try {
    await addAvatarExperience(userId, points);
    await checkAndEvolve(userId);
  } catch (error) {
    // No fallar si el avatar no existe todavia
    console.warn("[Gamification] Avatar evolution error:", error);
  }

  return {
    pointsAwarded: pointsResult.pointsAwarded,
    streakUpdated: !streakResult.continued || streakResult.currentStreak === 1,
    newAchievements: [...newAchievements, ...generalAchievements],
    leveledUp: pointsResult.leveledUp,
  };
}
