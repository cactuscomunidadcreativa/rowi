// src/app/api/gamification/leaderboard/route.ts
// ============================================================
// API de leaderboard/rankings de gamificación
// GET: Obtener top usuarios por puntos, rachas, etc.
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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "points"; // points | streak | achievements
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const period = searchParams.get("period") || "all"; // all | month | week

    // Obtener usuario actual
    const currentUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    let leaderboard: any[] = [];
    let currentUserRank: number | null = null;

    if (type === "points") {
      // Ranking por puntos totales
      const userLevels = await prisma.userLevel.findMany({
        orderBy: { totalPoints: "desc" },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              country: true,
            },
          },
        },
      });

      leaderboard = userLevels.map((ul, index) => ({
        rank: index + 1,
        userId: ul.user.id,
        name: ul.user.name || "Usuario Anónimo",
        image: ul.user.image,
        country: ul.user.country,
        score: ul.totalPoints,
        level: ul.level,
        title: ul.title,
        isCurrentUser: ul.user.id === currentUser?.id,
      }));

      // Obtener posición del usuario actual si no está en el top
      if (currentUser && !leaderboard.some((u) => u.isCurrentUser)) {
        const userLevel = await prisma.userLevel.findUnique({
          where: { userId: currentUser.id },
        });

        if (userLevel) {
          const rankCount = await prisma.userLevel.count({
            where: { totalPoints: { gt: userLevel.totalPoints } },
          });
          currentUserRank = rankCount + 1;
        }
      }
    } else if (type === "streak") {
      // Ranking por racha actual
      const userStreaks = await prisma.userStreak.findMany({
        orderBy: { currentStreak: "desc" },
        take: limit,
        where: { currentStreak: { gt: 0 } },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              country: true,
            },
          },
        },
      });

      leaderboard = userStreaks.map((us, index) => ({
        rank: index + 1,
        userId: us.user.id,
        name: us.user.name || "Usuario Anónimo",
        image: us.user.image,
        country: us.user.country,
        score: us.currentStreak,
        longestStreak: us.longestStreak,
        isCurrentUser: us.user.id === currentUser?.id,
      }));

      if (currentUser && !leaderboard.some((u) => u.isCurrentUser)) {
        const userStreak = await prisma.userStreak.findUnique({
          where: { userId: currentUser.id },
        });

        if (userStreak) {
          const rankCount = await prisma.userStreak.count({
            where: { currentStreak: { gt: userStreak.currentStreak } },
          });
          currentUserRank = rankCount + 1;
        }
      }
    } else if (type === "achievements") {
      // Ranking por achievements completados
      const achievementCounts = await prisma.userAchievement.groupBy({
        by: ["userId"],
        where: { completed: true },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: limit,
      });

      const userIds = achievementCounts.map((ac) => ac.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, image: true, country: true },
      });

      const usersMap = new Map(users.map((u) => [u.id, u]));

      leaderboard = achievementCounts.map((ac, index) => {
        const user = usersMap.get(ac.userId);
        return {
          rank: index + 1,
          userId: ac.userId,
          name: user?.name || "Usuario Anónimo",
          image: user?.image,
          country: user?.country,
          score: ac._count.id,
          isCurrentUser: ac.userId === currentUser?.id,
        };
      });

      if (currentUser && !leaderboard.some((u) => u.isCurrentUser)) {
        const userAchievementCount = await prisma.userAchievement.count({
          where: { userId: currentUser.id, completed: true },
        });

        const rankCount = await prisma.userAchievement.groupBy({
          by: ["userId"],
          where: { completed: true },
          _count: { id: true },
          having: { id: { _count: { gt: userAchievementCount } } },
        });

        currentUserRank = rankCount.length + 1;
      }
    }

    // Estadísticas generales
    const stats = {
      totalUsers: await prisma.userLevel.count(),
      totalPoints: await prisma.userLevel.aggregate({ _sum: { totalPoints: true } }),
      totalAchievements: await prisma.userAchievement.count({ where: { completed: true } }),
      avgStreak: await prisma.userStreak.aggregate({ _avg: { currentStreak: true } }),
    };

    return NextResponse.json({
      ok: true,
      data: {
        type,
        period,
        leaderboard,
        currentUserRank,
        stats: {
          totalUsers: stats.totalUsers,
          totalPointsGlobal: stats.totalPoints._sum.totalPoints || 0,
          totalAchievementsUnlocked: stats.totalAchievements,
          averageStreak: Math.round(stats.avgStreak._avg.currentStreak || 0),
        },
      },
    });
  } catch (e: any) {
    console.error("Error in gamification/leaderboard:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}
