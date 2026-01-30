// src/app/api/admin/gamification/achievements/route.ts
// ============================================================
// API Admin de Achievements
// GET: Listar todos los achievements
// POST: Crear nuevo achievement
// PATCH: Actualizar achievement
// DELETE: Eliminar achievement
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

// Helper para verificar si es admin
async function isAdmin(email: string) {
  const permission = await prisma.userPermission.findFirst({
    where: {
      user: { email },
      role: { in: ["SUPERADMIN", "ADMIN", "superadmin", "admin"] },
    },
  });
  return !!permission;
}

// GET: Listar todos los achievements con estadísticas
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase() || null;

    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(email))) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const includeStats = searchParams.get("stats") === "true";

    // Filtros
    const where: any = {};
    if (category) {
      where.category = category;
    }

    const achievements = await prisma.achievement.findMany({
      where,
      orderBy: [{ category: "asc" }, { points: "asc" }],
    });

    // Agregar estadísticas si se solicitan
    let achievementsWithStats = achievements;
    if (includeStats) {
      const stats = await prisma.userAchievement.groupBy({
        by: ["achievementId"],
        _count: { id: true },
        where: { completed: true },
      });

      const statsMap = new Map(stats.map((s) => [s.achievementId, s._count.id]));

      achievementsWithStats = achievements.map((a) => ({
        ...a,
        completedCount: statsMap.get(a.id) || 0,
      }));
    }

    // Estadísticas generales
    const totalUsers = await prisma.user.count();
    const usersWithAchievements = await prisma.userAchievement.groupBy({
      by: ["userId"],
      where: { completed: true },
    });

    return NextResponse.json({
      ok: true,
      data: {
        achievements: achievementsWithStats,
        stats: {
          totalAchievements: achievements.length,
          totalUsers,
          usersWithAchievements: usersWithAchievements.length,
          categories: [...new Set(achievements.map((a) => a.category))],
        },
      },
    });
  } catch (e: any) {
    console.error("Error in admin/gamification/achievements GET:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

// POST: Crear nuevo achievement
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase() || null;

    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(email))) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      slug,
      name,
      nameEN,
      description,
      descriptionEN,
      icon,
      color,
      category,
      requirement,
      threshold,
      points,
      rarity,
    } = body;

    if (!slug || !name || !description || !category || !requirement) {
      return NextResponse.json({
        ok: false,
        error: "Required fields: slug, name, description, category, requirement",
      }, { status: 400 });
    }

    // Verificar slug único
    const existing = await prisma.achievement.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ ok: false, error: "Slug already exists" }, { status: 400 });
    }

    const achievement = await prisma.achievement.create({
      data: {
        slug,
        name,
        nameEN: nameEN || null,
        description,
        descriptionEN: descriptionEN || null,
        icon: icon || "trophy",
        color: color || "#8B5CF6",
        category: category as any,
        requirement: requirement as any,
        threshold: threshold || 1,
        points: points || 10,
        rarity: rarity || "COMMON",
      },
    });

    return NextResponse.json({ ok: true, data: achievement });
  } catch (e: any) {
    console.error("Error in admin/gamification/achievements POST:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

// PATCH: Actualizar achievement
export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase() || null;

    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(email))) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "Achievement ID required" }, { status: 400 });
    }

    const achievement = await prisma.achievement.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, data: achievement });
  } catch (e: any) {
    console.error("Error in admin/gamification/achievements PATCH:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

// DELETE: Eliminar achievement
export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase() || null;

    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(email))) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, error: "Achievement ID required" }, { status: 400 });
    }

    // Soft delete (desactivar) en lugar de eliminar
    const achievement = await prisma.achievement.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ ok: true, data: achievement });
  } catch (e: any) {
    console.error("Error in admin/gamification/achievements DELETE:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}
