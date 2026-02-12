// src/app/api/social/feed/[id]/reactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/* =========================================================
   ❤️ API de Reacciones en Feed

   POST   — Toggle reacción (crear o cambiar)
   DELETE — Quitar reacción
========================================================= */

const VALID_REACTIONS = ["like", "love", "celebrate", "support", "insightful"];

/* =========================================================
   ❤️ POST — Toggle reacción
   Body: { type: "like" | "love" | "celebrate" | "support" | "insightful" }
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
    const { type = "like" } = await req.json();

    if (!VALID_REACTIONS.includes(type)) {
      return NextResponse.json(
        { ok: false, error: `Tipo inválido. Opciones: ${VALID_REACTIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // Verificar que el post existe
    const post = await prisma.rowiFeed.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });
    if (!post) {
      return NextResponse.json({ ok: false, error: "Post no encontrado" }, { status: 404 });
    }

    // Buscar reacción existente
    const existing = await prisma.feedReaction.findUnique({
      where: { feedId_userId: { feedId: id, userId: user.id } },
    });

    let reaction;
    let action: "created" | "updated" | "removed";

    if (existing) {
      if (existing.type === type) {
        // Misma reacción → quitar (toggle off)
        await prisma.feedReaction.delete({ where: { id: existing.id } });
        await prisma.rowiFeed.update({
          where: { id },
          data: { likes: { decrement: 1 } },
        });
        action = "removed";
        reaction = null;
      } else {
        // Diferente tipo → actualizar
        reaction = await prisma.feedReaction.update({
          where: { id: existing.id },
          data: { type },
        });
        action = "updated";
      }
    } else {
      // Nueva reacción
      reaction = await prisma.feedReaction.create({
        data: {
          feedId: id,
          userId: user.id,
          type,
        },
      });

      await prisma.rowiFeed.update({
        where: { id },
        data: { likes: { increment: 1 } },
      });
      action = "created";

      // Otorgar puntos (max 10 reacciones/día)
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayReactions = await prisma.feedReaction.count({
          where: {
            userId: user.id,
            createdAt: { gte: today },
          },
        });

        if (todayReactions <= 10) {
          const { awardPoints } = await import("@/services/gamification");
          await awardPoints({
            userId: user.id,
            amount: 1,
            reason: "REACTION",
            reasonId: reaction.id,
            description: "Reacción en feed",
          });
        }
      } catch (err) {
        console.error("⚠️ Error awarding reaction points:", err);
      }

      // Notificar al autor (si no es el mismo)
      if (post.authorId !== user.id) {
        try {
          await prisma.notificationQueue.create({
            data: {
              userId: post.authorId,
              type: "REACTION",
              channel: "IN_APP",
              title: "Nueva reacción",
              message: `${user.name || "Alguien"} reaccionó a tu publicación`,
              priority: 0,
              status: "PENDING",
              actionUrl: `/social/feed?post=${id}`,
              metadata: { reactionType: type, reactorId: user.id },
            },
          });
        } catch (err) {
          console.error("⚠️ Error creating reaction notification:", err);
        }
      }
    }

    // Obtener conteo actualizado de reacciones
    const reactions = await prisma.feedReaction.findMany({
      where: { feedId: id },
      select: { type: true },
    });

    const reactionsByType = reactions.reduce(
      (acc: Record<string, number>, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      },
      {}
    );

    return NextResponse.json({
      ok: true,
      action,
      reaction,
      reactionsByType,
      totalReactions: reactions.length,
    });
  } catch (e: any) {
    console.error("❌ POST /social/feed/[id]/reactions error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al reaccionar" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE — Quitar reacción
========================================================= */
export async function DELETE(
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

    const existing = await prisma.feedReaction.findUnique({
      where: { feedId_userId: { feedId: id, userId: user.id } },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "No has reaccionado a este post" },
        { status: 404 }
      );
    }

    await prisma.feedReaction.delete({ where: { id: existing.id } });
    await prisma.rowiFeed.update({
      where: { id },
      data: { likes: { decrement: 1 } },
    });

    return NextResponse.json({ ok: true, message: "Reacción eliminada" });
  } catch (e: any) {
    console.error("❌ DELETE /social/feed/[id]/reactions error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al eliminar reacción" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
