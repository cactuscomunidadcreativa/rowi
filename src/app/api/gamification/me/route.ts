// src/app/api/gamification/me/route.ts
// ============================================================
// API de estado de gamificación del usuario actual
// GET: Obtener nivel, puntos, racha, achievements del usuario
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase() || null;

    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, image: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Obtener nivel del usuario (o crear uno si no existe)
    let userLevel = await prisma.userLevel.findUnique({
      where: { userId: user.id },
    });

    if (!userLevel) {
      userLevel = await prisma.userLevel.create({
        data: {
          userId: user.id,
          level: 1,
          totalPoints: 0,
          pointsToNextLevel: 100,
          title: "Explorador Emocional",
          titleEN: "Emotional Explorer",
        },
      });
    }

    // Obtener racha del usuario (o crear una si no existe)
    let userStreak = await prisma.userStreak.findUnique({
      where: { userId: user.id },
    });

    if (!userStreak) {
      userStreak = await prisma.userStreak.create({
        data: {
          userId: user.id,
          currentStreak: 0,
          longestStreak: 0,
          multiplier: 1.0,
        },
      });
    }

    // Obtener achievements del usuario con info del achievement
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: {
        achievement: {
          select: {
            slug: true,
            name: true,
            nameEN: true,
            description: true,
            descriptionEN: true,
            icon: true,
            color: true,
            category: true,
            rarity: true,
            points: true,
          },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    // Separar completados y en progreso
    const completedAchievements = userAchievements.filter((ua) => ua.completed);
    const inProgressAchievements = userAchievements.filter((ua) => !ua.completed);

    // Obtener definición del nivel actual
    const levelDefinition = await prisma.levelDefinition.findFirst({
      where: {
        minPoints: { lte: userLevel.totalPoints },
        OR: [
          { maxPoints: { gte: userLevel.totalPoints } },
          { maxPoints: null },
        ],
      },
    });

    // Obtener siguiente nivel
    const nextLevel = await prisma.levelDefinition.findFirst({
      where: { level: userLevel.level + 1 },
    });

    // Calcular progreso hacia siguiente nivel
    const pointsInCurrentLevel = userLevel.totalPoints - (levelDefinition?.minPoints || 0);
    const pointsNeededForNext = nextLevel
      ? (nextLevel.minPoints - (levelDefinition?.minPoints || 0))
      : 0;
    const progressPercent = pointsNeededForNext > 0
      ? Math.min(100, Math.round((pointsInCurrentLevel / pointsNeededForNext) * 100))
      : 100;

    // Obtener historial reciente de puntos
    const recentPoints = await prisma.userPoints.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        amount: true,
        reason: true,
        description: true,
        createdAt: true,
      },
    });

    // Obtener rewards reclamados
    const claimedRewards = await prisma.userReward.findMany({
      where: { userId: user.id },
      include: {
        reward: {
          select: {
            slug: true,
            name: true,
            nameEN: true,
            icon: true,
            color: true,
            type: true,
          },
        },
      },
      orderBy: { claimedAt: "desc" },
      take: 10,
    });

    // Contar total de achievements disponibles
    const totalAchievements = await prisma.achievement.count({
      where: { isActive: true },
    });

    return NextResponse.json({
      ok: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
        level: {
          current: userLevel.level,
          title: levelDefinition?.title || userLevel.title,
          titleEN: levelDefinition?.titleEN || userLevel.titleEN,
          color: levelDefinition?.color || "#8B5CF6",
          icon: levelDefinition?.icon || "star",
          totalPoints: userLevel.totalPoints,
          pointsToNextLevel: nextLevel?.minPoints || null,
          progress: progressPercent,
          multiplier: levelDefinition?.multiplier || 1.0,
        },
        streak: {
          current: userStreak.currentStreak,
          longest: userStreak.longestStreak,
          lastActivityDate: userStreak.lastActivityDate,
          multiplier: userStreak.multiplier,
        },
        achievements: {
          completed: completedAchievements.length,
          total: totalAchievements,
          recent: completedAchievements.slice(0, 5).map((ua) => ({
            ...ua.achievement,
            completedAt: ua.completedAt,
          })),
          inProgress: inProgressAchievements.map((ua) => ({
            ...ua.achievement,
            progress: ua.progress,
          })),
        },
        recentPoints,
        claimedRewards: claimedRewards.map((ur) => ({
          ...ur.reward,
          claimedAt: ur.claimedAt,
          status: ur.status,
        })),
      },
    });
  } catch (e: any) {
    console.error("Error in gamification/me:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}
