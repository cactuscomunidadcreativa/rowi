// src/app/api/admin/gamification/levels/route.ts
// ============================================================
// API Admin de Niveles de Gamificación
// GET: Listar todos los niveles
// POST: Crear nuevo nivel
// PATCH: Actualizar nivel
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

// GET: Listar todos los niveles con estadísticas
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

    const levels = await prisma.levelDefinition.findMany({
      orderBy: { level: "asc" },
    });

    // Contar usuarios por nivel
    const userLevels = await prisma.userLevel.groupBy({
      by: ["level"],
      _count: { id: true },
    });

    const levelCounts = new Map(userLevels.map((ul) => [ul.level, ul._count.id]));

    const levelsWithStats = levels.map((level) => ({
      ...level,
      userCount: levelCounts.get(level.level) || 0,
    }));

    // Estadísticas generales
    const stats = {
      totalLevels: levels.length,
      totalUsers: await prisma.userLevel.count(),
      avgLevel: await prisma.userLevel.aggregate({ _avg: { level: true } }),
      maxLevel: await prisma.userLevel.aggregate({ _max: { level: true } }),
    };

    return NextResponse.json({
      ok: true,
      data: {
        levels: levelsWithStats,
        stats: {
          ...stats,
          avgLevel: Math.round(stats.avgLevel._avg.level || 1),
          maxLevelReached: stats.maxLevel._max.level || 1,
        },
      },
    });
  } catch (e: any) {
    console.error("Error in admin/gamification/levels GET:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

// POST: Crear nuevo nivel
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
      level,
      minPoints,
      maxPoints,
      title,
      titleEN,
      description,
      descriptionEN,
      icon,
      color,
      badge,
      benefits,
      multiplier,
    } = body;

    if (!level || minPoints === undefined || !title) {
      return NextResponse.json({
        ok: false,
        error: "Required fields: level, minPoints, title",
      }, { status: 400 });
    }

    // Verificar nivel único
    const existing = await prisma.levelDefinition.findUnique({ where: { level } });
    if (existing) {
      return NextResponse.json({ ok: false, error: "Level already exists" }, { status: 400 });
    }

    const levelDef = await prisma.levelDefinition.create({
      data: {
        level,
        minPoints,
        maxPoints: maxPoints || null,
        title,
        titleEN: titleEN || null,
        description: description || null,
        descriptionEN: descriptionEN || null,
        icon: icon || "star",
        color: color || "#8B5CF6",
        badge: badge || null,
        benefits: benefits || null,
        multiplier: multiplier || 1.0,
      },
    });

    return NextResponse.json({ ok: true, data: levelDef });
  } catch (e: any) {
    console.error("Error in admin/gamification/levels POST:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

// PATCH: Actualizar nivel
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
    const { id, level: levelNum, ...updateData } = body;

    if (!id && !levelNum) {
      return NextResponse.json({ ok: false, error: "Level ID or level number required" }, { status: 400 });
    }

    const levelDef = await prisma.levelDefinition.update({
      where: id ? { id } : { level: levelNum },
      data: updateData,
    });

    return NextResponse.json({ ok: true, data: levelDef });
  } catch (e: any) {
    console.error("Error in admin/gamification/levels PATCH:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}
