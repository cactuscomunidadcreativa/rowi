// src/app/api/microlearning/route.ts
// ============================================================
// API de MicroLearning para usuarios
// GET: Listar micro-acciones disponibles
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
      select: { id: true, preferredLang: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const parentKey = searchParams.get("parentKey");
    const featured = searchParams.get("featured") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    // Filtros
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (parentKey) where.parentKey = parentKey;
    if (featured) where.isFeatured = true;

    // Obtener micro-learnings
    const microLearnings = await prisma.microLearning.findMany({
      where,
      orderBy: [{ category: "asc" }, { parentKey: "asc" }, { order: "asc" }],
      take: limit,
    });

    // Obtener progreso del usuario
    const userProgress = await prisma.userMicroLearning.findMany({
      where: { userId: user.id },
      select: {
        microLearningId: true,
        status: true,
        progress: true,
        completedAt: true,
        rating: true,
      },
    });

    const progressMap = new Map(userProgress.map((p) => [p.microLearningId, p]));

    // Combinar datos
    const lang = user.preferredLang || "es";
    const microLearningsWithProgress = microLearnings.map((ml) => {
      const progress = progressMap.get(ml.id);
      return {
        id: ml.id,
        slug: ml.slug,
        category: ml.category,
        parentKey: ml.parentKey,
        title: lang === "en" && ml.titleEN ? ml.titleEN : ml.title,
        description: lang === "en" && ml.descriptionEN ? ml.descriptionEN : ml.description,
        duration: ml.duration,
        difficulty: ml.difficulty,
        points: ml.points,
        isFeatured: ml.isFeatured,
        content: ml.content,
        // Progreso del usuario
        userStatus: progress?.status || "NOT_STARTED",
        userProgress: progress?.progress || 0,
        completedAt: progress?.completedAt || null,
        userRating: progress?.rating || null,
      };
    });

    // Agrupar por categoría
    const byCategory = microLearningsWithProgress.reduce((acc, ml) => {
      if (!acc[ml.category]) acc[ml.category] = [];
      acc[ml.category].push(ml);
      return acc;
    }, {} as Record<string, typeof microLearningsWithProgress>);

    // Estadísticas
    const stats = {
      total: microLearnings.length,
      completed: userProgress.filter((p) => p.status === "COMPLETED").length,
      inProgress: userProgress.filter((p) => p.status === "IN_PROGRESS").length,
      categories: Object.keys(byCategory),
    };

    return NextResponse.json({
      ok: true,
      data: {
        microLearnings: microLearningsWithProgress,
        byCategory,
        stats,
      },
    });
  } catch (e: any) {
    console.error("Error in microlearning GET:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}
