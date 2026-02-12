// src/app/api/social/profile/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/* =========================================================
   👤 Perfil Social Público

   GET — Perfil de otro usuario con stats sociales
   Respeta profileVisibility (public/connections/private)
========================================================= */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const viewer = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!viewer) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const { userId } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        headline: true,
        bio: true,
        profileVisibility: true,
        socialLinks: true,
        createdAt: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const isOwner = viewer.id === userId;
    const visibility = targetUser.profileVisibility || "public";

    // Verificar si son conexiones
    let isConnection = false;
    if (!isOwner) {
      const relation = await prisma.rowiRelation.findFirst({
        where: {
          OR: [
            { initiatorId: viewer.id, receiverId: userId },
            { initiatorId: userId, receiverId: viewer.id },
          ],
          status: "active",
        },
      });
      isConnection = !!relation;
    }

    // Si es privado y no es conexión ni owner, mostrar mínimo
    if (visibility === "private" && !isOwner && !isConnection) {
      return NextResponse.json({
        ok: true,
        profile: {
          id: targetUser.id,
          name: targetUser.name,
          image: targetUser.image,
          restricted: true,
          visibility: "private",
        },
      });
    }

    // Si es connections-only y no es conexión ni owner, mostrar mínimo
    if (visibility === "connections" && !isOwner && !isConnection) {
      return NextResponse.json({
        ok: true,
        profile: {
          id: targetUser.id,
          name: targetUser.name,
          image: targetUser.image,
          headline: targetUser.headline,
          restricted: true,
          visibility: "connections",
        },
      });
    }

    // Obtener stats sociales
    const [
      connectionsCount,
      communitiesCount,
      achievementsCount,
      goalsCount,
      userLevel,
      userStreak,
      recentAchievements,
      activeGoals,
    ] = await Promise.all([
      prisma.rowiRelation.count({
        where: {
          OR: [{ initiatorId: userId }, { receiverId: userId }],
          status: "active",
        },
      }),
      prisma.rowiCommunityUser.count({
        where: { userId },
      }),
      prisma.userAchievement.count({
        where: { userId, completed: true },
      }),
      prisma.nobleGoal.count({
        where: { authorId: userId },
      }),
      prisma.userLevel.findUnique({
        where: { userId },
        select: { level: true, totalPoints: true },
      }),
      prisma.userStreak.findUnique({
        where: { userId },
        select: { currentStreak: true, longestStreak: true },
      }),
      prisma.userAchievement.findMany({
        where: { userId, completed: true },
        orderBy: { completedAt: "desc" },
        take: 5,
        include: {
          achievement: {
            select: {
              name: true,
              nameEN: true,
              icon: true,
              color: true,
              rarity: true,
            },
          },
        },
      }),
      prisma.nobleGoal.findMany({
        where: { authorId: userId, status: "active" },
        take: 3,
        select: {
          id: true,
          title: true,
          category: true,
          progress: true,
          participantCount: true,
        },
      }),
    ]);

    const profile = {
      id: targetUser.id,
      name: targetUser.name,
      email: isOwner || isConnection ? targetUser.email : undefined,
      image: targetUser.image,
      headline: targetUser.headline,
      bio: targetUser.bio,
      socialLinks: targetUser.socialLinks,
      memberSince: targetUser.createdAt,
      restricted: false,
      visibility,
      isConnection,
      isOwner,

      socialStats: {
        connectionsCount,
        communitiesCount,
        achievementsCount,
        goalsCount,
        level: userLevel?.level || 1,
        totalPoints: userLevel?.totalPoints || 0,
        currentStreak: userStreak?.currentStreak || 0,
        longestStreak: userStreak?.longestStreak || 0,
      },

      recentAchievements: recentAchievements.map((ua) => ({
        name: ua.achievement.name,
        nameEN: ua.achievement.nameEN,
        icon: ua.achievement.icon,
        color: ua.achievement.color,
        rarity: ua.achievement.rarity,
        completedAt: ua.completedAt,
      })),

      activeGoals,
    };

    return NextResponse.json({ ok: true, profile });
  } catch (e: any) {
    console.error("❌ GET /social/profile/[userId] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al obtener perfil" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
