// src/app/api/social/goals/[id]/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/* =========================================================
   🤝 Unirse a un Noble Goal

   POST — Unirse al goal
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
    const { message, role = "supporter" } = await req.json().catch(() => ({}));

    // Verificar goal existe y está activo
    const goal = await prisma.nobleGoal.findUnique({
      where: { id },
      select: { id: true, authorId: true, title: true, status: true },
    });
    if (!goal) {
      return NextResponse.json({ ok: false, error: "Goal no encontrado" }, { status: 404 });
    }
    if (goal.status !== "active") {
      return NextResponse.json(
        { ok: false, error: "Este goal no está activo" },
        { status: 400 }
      );
    }

    // Verificar que no sea ya participante
    const existing = await prisma.nobleGoalParticipant.findUnique({
      where: { goalId_userId: { goalId: id, userId: user.id } },
    });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Ya eres participante de este goal" },
        { status: 409 }
      );
    }

    // Crear participación e incrementar contador
    const [participant] = await prisma.$transaction([
      prisma.nobleGoalParticipant.create({
        data: {
          goalId: id,
          userId: user.id,
          role: role === "contributor" ? "contributor" : "supporter",
          message: message?.trim() || null,
        },
      }),
      prisma.nobleGoal.update({
        where: { id },
        data: { participantCount: { increment: 1 } },
      }),
    ]);

    // Otorgar puntos
    try {
      const { awardPoints } = await import("@/services/gamification");
      await awardPoints({
        userId: user.id,
        amount: 10,
        reason: "NOBLE_GOAL",
        reasonId: id,
        description: "Unirse a causa noble",
      });
    } catch (err) {
      console.error("⚠️ Error awarding join points:", err);
    }

    // Notificar al autor
    if (goal.authorId !== user.id) {
      try {
        await prisma.notificationQueue.create({
          data: {
            userId: goal.authorId,
            type: "NEW_CONNECTION",
            channel: "IN_APP",
            title: "Nuevo participante",
            message: `${user.name || "Alguien"} se unió a tu causa "${goal.title}"`,
            priority: 1,
            status: "PENDING",
            actionUrl: `/social/goals/${id}`,
            metadata: { goalId: id, joinerId: user.id },
          },
        });
      } catch (err) {
        console.error("⚠️ Error creating join notification:", err);
      }
    }

    // Registrar actividad
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        targetUserId: goal.authorId,
        action: "NOBLE_GOAL_JOINED",
        entity: "NobleGoal",
        targetId: id,
        details: { role, goalTitle: goal.title },
      },
    });

    return NextResponse.json({ ok: true, participant }, { status: 201 });
  } catch (e: any) {
    console.error("❌ POST /social/goals/[id]/join error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al unirse al goal" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
