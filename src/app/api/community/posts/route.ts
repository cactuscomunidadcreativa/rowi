// src/app/api/community/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/* =========================================================
   💬 API de Posts de Comunidad (Foro)

   GET  — Listar posts top-level de una comunidad
   POST — Crear post o respuesta (con parentId)
========================================================= */

/* =========================================================
   🔍 GET — Listar posts
   Query: ?communityId=X&sort=recent|popular&page=1&limit=20
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get("communityId");
    const sort = searchParams.get("sort") || "recent";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (!communityId) {
      return NextResponse.json(
        { ok: false, error: "communityId es obligatorio" },
        { status: 400 }
      );
    }

    const where: any = {
      communityId,
      parentId: null, // Solo posts raíz
    };

    const orderBy: any = sort === "popular"
      ? [{ isPinned: "desc" }, { replyCount: "desc" }, { createdAt: "desc" }]
      : [{ isPinned: "desc" }, { createdAt: "desc" }];

    const [posts, total] = await Promise.all([
      prisma.rowiCommunityPost.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true, image: true, headline: true },
          },
          _count: {
            select: { replies: true },
          },
        },
      }),
      prisma.rowiCommunityPost.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      total,
      pages: Math.ceil(total / limit),
      page,
      posts: posts.map((p) => ({
        ...p,
        replyCount: p._count.replies,
      })),
    });
  } catch (e: any) {
    console.error("❌ GET /community/posts error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al obtener posts" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Crear post o respuesta
   Body: { communityId, content, parentId?, title? }
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
      select: { id: true, name: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const { communityId, content, parentId, title } = await req.json();

    if (!communityId || !content?.trim()) {
      return NextResponse.json(
        { ok: false, error: "communityId y content son obligatorios" },
        { status: 400 }
      );
    }

    // Verificar membresía
    const membership = await prisma.rowiCommunityUser.findFirst({
      where: { userId: user.id, communityId },
    });
    if (!membership) {
      return NextResponse.json(
        { ok: false, error: "No eres miembro de esta comunidad" },
        { status: 403 }
      );
    }

    let depth = 0;
    if (parentId) {
      const parent = await prisma.rowiCommunityPost.findUnique({
        where: { id: parentId },
        select: { depth: true, communityId: true },
      });
      if (!parent) {
        return NextResponse.json(
          { ok: false, error: "Post padre no encontrado" },
          { status: 404 }
        );
      }
      if (parent.communityId !== communityId) {
        return NextResponse.json(
          { ok: false, error: "El post padre no pertenece a esta comunidad" },
          { status: 400 }
        );
      }
      depth = (parent.depth || 0) + 1;
      if (depth > 5) {
        return NextResponse.json(
          { ok: false, error: "Máximo 5 niveles de anidamiento" },
          { status: 400 }
        );
      }
    }

    const post = await prisma.rowiCommunityPost.create({
      data: {
        communityId,
        authorId: user.id,
        content: title ? `${title.trim()}\n\n${content.trim()}` : content.trim(),
        parentId: parentId || null,
        depth,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    // Incrementar replyCount del padre
    if (parentId) {
      await prisma.rowiCommunityPost.update({
        where: { id: parentId },
        data: { replyCount: { increment: 1 } },
      });
    }

    // Otorgar puntos
    try {
      const { awardPoints } = await import("@/services/gamification");
      await awardPoints({
        userId: user.id,
        amount: parentId ? 5 : 5,
        reason: parentId ? "FORUM_REPLY" : ("POST" as any),
        reasonId: post.id,
        description: parentId ? "Respuesta en foro" : "Post en foro",
      });
    } catch (err) {
      console.error("⚠️ Error awarding forum points:", err);
    }

    // Notificar al autor del post padre
    if (parentId) {
      const parentPost = await prisma.rowiCommunityPost.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      });
      if (parentPost && parentPost.authorId !== user.id) {
        try {
          await prisma.notificationQueue.create({
            data: {
              userId: parentPost.authorId,
              type: "COMMENT",
              channel: "IN_APP",
              title: "Nueva respuesta en el foro",
              message: `${user.name || "Alguien"} respondió a tu publicación`,
              priority: 1,
              status: "PENDING",
              actionUrl: `/community?post=${parentId}`,
              metadata: { postId: post.id, replierId: user.id },
            },
          });
        } catch (err) {
          console.error("⚠️ Error creating forum reply notification:", err);
        }
      }
    }

    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch (e: any) {
    console.error("❌ POST /community/posts error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al crear post" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
