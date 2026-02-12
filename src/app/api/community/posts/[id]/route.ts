// src/app/api/community/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/* =========================================================
   💬 Post Individual de Comunidad

   GET    — Post con replies (árbol)
   PATCH  — Editar post
   DELETE — Eliminar post
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

    const post = await prisma.rowiCommunityPost.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, image: true, headline: true },
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
        },
        _count: { select: { replies: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ ok: false, error: "Post no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, post });
  } catch (e: any) {
    console.error("❌ GET /community/posts/[id] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al obtener post" },
      { status: 500 }
    );
  }
}

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
    const existing = await prisma.rowiCommunityPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Post no encontrado" }, { status: 404 });
    }
    if (existing.authorId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Solo puedes editar tus posts" },
        { status: 403 }
      );
    }

    const { content } = await req.json();
    const updateData: any = {};
    if (content !== undefined) updateData.content = content.trim();

    const updated = await prisma.rowiCommunityPost.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, post: updated });
  } catch (e: any) {
    console.error("❌ PATCH /community/posts/[id] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al editar post" },
      { status: 500 }
    );
  }
}

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
    const existing = await prisma.rowiCommunityPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Post no encontrado" }, { status: 404 });
    }
    if (existing.authorId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Solo puedes eliminar tus posts" },
        { status: 403 }
      );
    }

    // Decrement parent replyCount
    if (existing.parentId) {
      await prisma.rowiCommunityPost.update({
        where: { id: existing.parentId },
        data: { replyCount: { decrement: 1 } },
      }).catch(() => {});
    }

    await prisma.rowiCommunityPost.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: "Post eliminado" });
  } catch (e: any) {
    console.error("❌ DELETE /community/posts/[id] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al eliminar post" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
