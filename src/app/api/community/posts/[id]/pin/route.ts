// src/app/api/community/posts/[id]/pin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/* =========================================================
   📌 Pin/Unpin post de comunidad
   Solo admin/owner de la comunidad
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

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    const post = await prisma.rowiCommunityPost.findUnique({
      where: { id },
      select: { id: true, communityId: true, isPinned: true },
    });
    if (!post) {
      return NextResponse.json({ ok: false, error: "Post no encontrado" }, { status: 404 });
    }

    // Verificar que el usuario es admin/owner de la comunidad
    const membership = await prisma.rowiCommunityUser.findFirst({
      where: {
        userId: user.id,
        communityId: post.communityId,
        role: { in: ["owner", "admin"] },
      },
    });
    if (!membership) {
      return NextResponse.json(
        { ok: false, error: "Solo admins pueden fijar posts" },
        { status: 403 }
      );
    }

    const updated = await prisma.rowiCommunityPost.update({
      where: { id },
      data: { isPinned: !post.isPinned },
    });

    return NextResponse.json({
      ok: true,
      isPinned: updated.isPinned,
      message: updated.isPinned ? "Post fijado" : "Post desfijado",
    });
  } catch (e: any) {
    console.error("❌ POST /community/posts/[id]/pin error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al fijar/desfijar post" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
