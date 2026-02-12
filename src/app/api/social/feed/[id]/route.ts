// src/app/api/social/feed/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/* =========================================================
   📰 API de Post Individual

   GET    — Detalle de post con comentarios completos
   PATCH  — Editar post propio
   DELETE — Eliminar post propio
========================================================= */

/* =========================================================
   🔍 GET — Detalle del post
========================================================= */
export async function GET(
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

    const post = await prisma.rowiFeed.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            headline: true,
          },
        },
        feedComments: {
          where: { parentId: null }, // Solo comentarios raíz
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: { id: true, name: true, image: true },
            },
            replies: {
              orderBy: { createdAt: "asc" },
              include: {
                author: {
                  select: { id: true, name: true, image: true },
                },
              },
            },
          },
        },
        feedReactions: {
          select: { id: true, userId: true, type: true },
        },
        _count: {
          select: { feedComments: true, feedReactions: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { ok: false, error: "Post no encontrado" },
        { status: 404 }
      );
    }

    // Verificar visibilidad
    if (post.visibility === "private" && post.authorId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "No tienes acceso a este post" },
        { status: 403 }
      );
    }

    // Procesar reacciones
    const reactionsByType = post.feedReactions.reduce(
      (acc: Record<string, number>, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      },
      {}
    );

    const userReaction = post.feedReactions.find((r) => r.userId === user.id);

    return NextResponse.json({
      ok: true,
      post: {
        ...post,
        reactionsByType,
        userReaction: userReaction?.type || null,
        commentCount: post._count.feedComments,
        reactionCount: post._count.feedReactions,
      },
    });
  } catch (e: any) {
    console.error("❌ GET /social/feed/[id] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al obtener post" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✏️ PATCH — Editar post propio
   Body: { content?, mood?, visibility?, tags? }
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

    const existing = await prisma.rowiFeed.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Post no encontrado" }, { status: 404 });
    }
    if (existing.authorId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Solo puedes editar tus propios posts" },
        { status: 403 }
      );
    }

    const { content, mood, visibility, tags } = await req.json();
    const updateData: any = {};

    if (content !== undefined) {
      if (content.trim().length === 0) {
        return NextResponse.json(
          { ok: false, error: "El contenido no puede estar vacío" },
          { status: 400 }
        );
      }
      updateData.content = content.trim();
    }
    if (mood !== undefined) updateData.mood = mood;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (tags !== undefined) updateData.tags = tags;

    const updated = await prisma.rowiFeed.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, post: updated });
  } catch (e: any) {
    console.error("❌ PATCH /social/feed/[id] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al editar post" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE — Eliminar post propio
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

    const existing = await prisma.rowiFeed.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Post no encontrado" }, { status: 404 });
    }
    if (existing.authorId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Solo puedes eliminar tus propios posts" },
        { status: 403 }
      );
    }

    // Elimina en cascada (comments y reactions por onDelete: Cascade)
    await prisma.rowiFeed.delete({ where: { id } });

    return NextResponse.json({ ok: true, message: "Post eliminado" });
  } catch (e: any) {
    console.error("❌ DELETE /social/feed/[id] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al eliminar post" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
