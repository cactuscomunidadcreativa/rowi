// src/app/api/social/feed/[id]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/* =========================================================
   💬 API de Comentarios en Feed

   GET  — Listar comentarios de un post
   POST — Crear comentario (con threading opcional)
========================================================= */

/* =========================================================
   🔍 GET — Listar comentarios
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

    // Verificar que el post existe
    const post = await prisma.rowiFeed.findUnique({ where: { id }, select: { id: true } });
    if (!post) {
      return NextResponse.json({ ok: false, error: "Post no encontrado" }, { status: 404 });
    }

    const comments = await prisma.feedComment.findMany({
      where: { feedId: id, parentId: null }, // Solo raíz
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
      },
    });

    return NextResponse.json({ ok: true, total: comments.length, comments });
  } catch (e: any) {
    console.error("❌ GET /social/feed/[id]/comments error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al obtener comentarios" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Crear comentario
   Body: { content, parentId? }
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
    const { content, parentId } = await req.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "El comentario no puede estar vacío" },
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

    // Si hay parentId, verificar que existe
    if (parentId) {
      const parent = await prisma.feedComment.findUnique({ where: { id: parentId } });
      if (!parent) {
        return NextResponse.json(
          { ok: false, error: "Comentario padre no encontrado" },
          { status: 404 }
        );
      }
    }

    const comment = await prisma.feedComment.create({
      data: {
        feedId: id,
        authorId: user.id,
        content: content.trim(),
        parentId: parentId || undefined,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    // Incrementar contador de comentarios en el post
    await prisma.rowiFeed.update({
      where: { id },
      data: { comments: { increment: 1 } },
    });

    // Otorgar puntos
    try {
      const { awardPoints } = await import("@/services/gamification");
      await awardPoints({
        userId: user.id,
        amount: 3,
        reason: "COMMENT" as any,
        reasonId: comment.id,
        description: "Comentario en feed",
      });
    } catch (err) {
      console.error("⚠️ Error awarding comment points:", err);
    }

    // Notificar al autor del post (si no es el mismo usuario)
    if (post.authorId !== user.id) {
      try {
        await prisma.notificationQueue.create({
          data: {
            userId: post.authorId,
            type: "COMMENT",
            channel: "IN_APP",
            title: "Nuevo comentario",
            message: `${user.name || "Alguien"} comentó en tu publicación`,
            priority: 1,
            status: "PENDING",
            actionUrl: `/social/feed?post=${id}`,
            metadata: { commentId: comment.id, commenterId: user.id },
          },
        });
      } catch (err) {
        console.error("⚠️ Error creating comment notification:", err);
      }
    }

    return NextResponse.json({ ok: true, comment }, { status: 201 });
  } catch (e: any) {
    console.error("❌ POST /social/feed/[id]/comments error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al crear comentario" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
