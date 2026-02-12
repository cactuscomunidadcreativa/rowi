// src/app/api/social/goals/[id]/updates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { createAutoFeedEntry } from "@/services/social-feed";

export const runtime = "nodejs";

/* =========================================================
   📝 Updates de Noble Goal

   GET  — Listar updates del goal
   POST — Crear update de progreso
========================================================= */

/* =========================================================
   🔍 GET — Listar updates
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

    const updates = await prisma.nobleGoalUpdate.findMany({
      where: { goalId: id },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json({ ok: true, total: updates.length, updates });
  } catch (e: any) {
    console.error("❌ GET /social/goals/[id]/updates error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al obtener updates" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Crear update
   Body: { content, progress? }
========================================================= */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const { id } = await params;
    const { content, progress } = await req.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "El contenido es obligatorio" },
        { status: 400 }
      );
    }

    // Verificar goal y que el usuario sea participante
    const goal = await prisma.nobleGoal.findUnique({
      where: { id },
      select: { id: true, authorId: true, title: true, visibility: true },
    });
    if (!goal) {
      return NextResponse.json({ ok: false, error: "Goal no encontrado" }, { status: 404 });
    }

    const participation = await prisma.nobleGoalParticipant.findUnique({
      where: { goalId_userId: { goalId: id, userId: user.id } },
    });
    if (!participation) {
      return NextResponse.json(
        { ok: false, error: "Debes ser participante para crear updates" },
        { status: 403 }
      );
    }

    // Crear update
    const update = await prisma.nobleGoalUpdate.create({
      data: {
        goalId: id,
        authorId: user.id,
        content: content.trim(),
        progress: progress !== undefined ? Math.max(0, Math.min(100, progress)) : null,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    // Actualizar progreso del goal si se proporcionó
    if (progress !== undefined && goal.authorId === user.id) {
      await prisma.nobleGoal.update({
        where: { id },
        data: { progress: Math.max(0, Math.min(100, progress)) },
      });
    }

    // Auto feed entry si el goal es público
    if (goal.visibility === "public") {
      try {
        await createAutoFeedEntry({
          authorId: user.id,
          type: "noble_goal",
          sourceType: "noble_goal_update",
          sourceId: update.id,
          content: `📝 Actualizó el progreso de "${goal.title}": ${content.trim().slice(0, 200)}`,
          metadata: { goalId: id, progress },
          visibility: "public",
        });
      } catch (err) {
        console.error("⚠️ Error creating update feed entry:", err);
      }
    }

    return NextResponse.json({ ok: true, update }, { status: 201 });
  } catch (e: any) {
    console.error("❌ POST /social/goals/[id]/updates error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al crear update" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
