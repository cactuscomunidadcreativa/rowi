// src/app/api/social/goals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/* =========================================================
   🎯 API de Noble Goal Individual

   GET   — Detalle del goal con participantes y updates
   PATCH — Actualizar goal (solo autor)
========================================================= */

/* =========================================================
   🔍 GET — Detalle del goal
========================================================= */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const goal = await prisma.nobleGoal.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, image: true, headline: true },
        },
        participants: {
          orderBy: { joinedAt: "asc" },
          include: {
            user: {
              select: { id: true, name: true, image: true, headline: true },
            },
          },
        },
        updates: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            author: {
              select: { id: true, name: true, image: true },
            },
          },
        },
        _count: {
          select: { participants: true, updates: true },
        },
      },
    });

    if (!goal) {
      return NextResponse.json({ ok: false, error: "Goal no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, goal });
  } catch (e: any) {
    console.error("❌ GET /social/goals/[id] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al obtener goal" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✏️ PATCH — Actualizar goal (solo autor)
   Body: { title?, description?, status?, progress?, targetDate?, visibility? }
========================================================= */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    const existing = await prisma.nobleGoal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Goal no encontrado" }, { status: 404 });
    }
    if (existing.authorId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Solo el autor puede editar este goal" },
        { status: 403 }
      );
    }

    const { title, description, status, progress, targetDate, visibility } = await req.json();
    const updateData: any = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (progress !== undefined) updateData.progress = Math.max(0, Math.min(100, progress));
    if (targetDate !== undefined) updateData.targetDate = targetDate ? new Date(targetDate) : null;
    if (visibility !== undefined) updateData.visibility = visibility;

    const updated = await prisma.nobleGoal.update({
      where: { id },
      data: updateData,
    });

    // Si se completó, otorgar puntos extra
    if (status === "completed" && existing.status !== "completed") {
      try {
        const { awardPoints } = await import("@/services/gamification");
        await awardPoints({
          userId: user.id,
          amount: 200,
          reason: "NOBLE_GOAL",
          reasonId: updated.id,
          description: "Causa noble completada",
        });
      } catch (err) {
        console.error("⚠️ Error awarding goal completion points:", err);
      }
    }

    return NextResponse.json({ ok: true, goal: updated });
  } catch (e: any) {
    console.error("❌ PATCH /social/goals/[id] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al actualizar goal" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
