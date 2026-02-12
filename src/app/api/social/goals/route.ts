// src/app/api/social/goals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { createAutoFeedEntry } from "@/services/social-feed";

export const runtime = "nodejs";

/* =========================================================
   🎯 API de Noble Goals (Causas Nobles)

   GET  — Listar goals (mis goals, públicos, de comunidad)
   POST — Crear noble goal
========================================================= */

const GOAL_CATEGORIES = [
  "bienestar", "educacion", "comunidad", "medio_ambiente",
  "liderazgo", "relaciones", "salud", "creatividad",
];

/* =========================================================
   🔍 GET — Listar noble goals
   Query: ?filter=mine|explore|community&communityId=X&category=X&status=active
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, primaryTenantId: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "explore";
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "active";

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;

    if (filter === "mine") {
      // Goals del usuario (como autor o participante)
      where.OR = [
        { authorId: user.id },
        { participants: { some: { userId: user.id } } },
      ];
    } else if (filter === "community") {
      // Goals de comunidades del usuario
      const userCommunities = await prisma.rowiCommunityUser.findMany({
        where: { userId: user.id },
        select: { communityId: true },
      });
      where.communityId = { in: userCommunities.map((c) => c.communityId) };
    } else {
      // Explorar: goals públicos
      where.visibility = "public";
    }

    const goals = await prisma.nobleGoal.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, image: true, headline: true },
        },
        participants: {
          take: 5,
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
        _count: {
          select: { participants: true, updates: true },
        },
      },
      orderBy: [{ participantCount: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    return NextResponse.json({
      ok: true,
      total: goals.length,
      goals,
      categories: GOAL_CATEGORIES,
    });
  } catch (e: any) {
    console.error("❌ GET /social/goals error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al obtener goals" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Crear noble goal
   Body: { title, description?, category, icon?, color?,
           visibility?, targetDate?, communityId? }
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, primaryTenantId: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const {
      title,
      description,
      category = "bienestar",
      icon,
      color,
      visibility = "public",
      targetDate,
      communityId,
    } = await req.json();

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "El título es obligatorio" },
        { status: 400 }
      );
    }

    if (!GOAL_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { ok: false, error: `Categoría inválida. Opciones: ${GOAL_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    // Crear goal + participante como creator
    const goal = await prisma.$transaction(async (tx) => {
      const newGoal = await tx.nobleGoal.create({
        data: {
          authorId: user.id,
          title: title.trim(),
          description: description?.trim() || null,
          category,
          icon,
          color,
          visibility,
          targetDate: targetDate ? new Date(targetDate) : null,
          tenantId: user.primaryTenantId,
          communityId: communityId || null,
          participantCount: 1,
        },
      });

      // Agregar como creator
      await tx.nobleGoalParticipant.create({
        data: {
          goalId: newGoal.id,
          userId: user.id,
          role: "creator",
        },
      });

      return newGoal;
    });

    // Otorgar puntos
    try {
      const { awardPoints } = await import("@/services/gamification");
      await awardPoints({
        userId: user.id,
        amount: 25,
        reason: "NOBLE_GOAL",
        reasonId: goal.id,
        description: "Crear causa noble",
      });
    } catch (err) {
      console.error("⚠️ Error awarding goal points:", err);
    }

    // Auto feed entry
    try {
      await createAutoFeedEntry({
        authorId: user.id,
        type: "noble_goal",
        sourceType: "noble_goal",
        sourceId: goal.id,
        content: `🎯 Ha creado una nueva causa noble: "${goal.title}"`,
        metadata: { goalId: goal.id, category: goal.category },
        visibility: goal.visibility,
      });
    } catch (err) {
      console.error("⚠️ Error creating auto feed entry:", err);
    }

    // Registrar actividad
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "NOBLE_GOAL_CREATED",
        entity: "NobleGoal",
        targetId: goal.id,
        details: { title: goal.title, category: goal.category },
      },
    });

    console.log(`🎯 Noble Goal creado: ${goal.title} by ${user.id}`);
    return NextResponse.json({ ok: true, goal }, { status: 201 });
  } catch (e: any) {
    console.error("❌ POST /social/goals error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al crear goal" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
