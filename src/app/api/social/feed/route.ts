// src/app/api/social/feed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { getUserFeed } from "@/services/social-feed";

export const runtime = "nodejs";

/* =========================================================
   📰 API del Social Feed

   GET  — Feed del usuario (paginado con cursor)
   POST — Crear post manual
========================================================= */

/* =========================================================
   🔍 GET — Obtener feed
   Query: ?cursor=ISO_DATE&limit=20&communityId=X&type=post
========================================================= */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");
    const communityId = searchParams.get("communityId") || undefined;
    const type = searchParams.get("type") || undefined;

    const { items, nextCursor } = await getUserFeed({
      userId: user.id,
      cursor,
      limit: Math.min(limit, 50),
      communityId,
      type,
    });

    return NextResponse.json({
      ok: true,
      total: items.length,
      items,
      nextCursor,
    });
  } catch (e: any) {
    console.error("❌ GET /social/feed error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al obtener feed" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Crear post manual
   Body: { content, mood?, visibility?, tags?, communityId?, mediaUrls? }
========================================================= */
export async function POST(req: NextRequest) {
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

    const {
      content,
      mood,
      visibility = "public",
      tags = [],
      communityId,
      mediaUrls = [],
      sharedGoalId,
    } = await req.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "El contenido no puede estar vacío" },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { ok: false, error: "El contenido no puede exceder 5000 caracteres" },
        { status: 400 }
      );
    }

    // Si es post de comunidad, verificar membresía
    if (communityId) {
      const membership = await prisma.rowiCommunityUser.findFirst({
        where: { userId: user.id, communityId },
      });
      if (!membership) {
        return NextResponse.json(
          { ok: false, error: "No eres miembro de esta comunidad" },
          { status: 403 }
        );
      }
    }

    const post = await prisma.rowiFeed.create({
      data: {
        authorId: user.id,
        content: content.trim(),
        type: "post",
        mood,
        visibility,
        tags,
        communityId: communityId || undefined,
        mediaUrls,
        sharedGoalId: sharedGoalId || undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            headline: true,
          },
        },
      },
    });

    // Otorgar puntos por publicar
    try {
      const { awardPoints } = await import("@/services/gamification");
      await awardPoints({
        userId: user.id,
        amount: 5,
        reason: "POST" as any,
        reasonId: post.id,
        description: "Publicación en el feed",
      });
    } catch (err) {
      console.error("⚠️ Error awarding post points:", err);
    }

    // Registrar actividad
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "FEED_POST_CREATED",
        entity: "RowiFeed",
        targetId: post.id,
        details: { type: "post", visibility, communityId },
      },
    });

    console.log(`📰 Nuevo post: ${user.id}`);
    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch (e: any) {
    console.error("❌ POST /social/feed error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al crear post" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
