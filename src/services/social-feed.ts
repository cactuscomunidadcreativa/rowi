// src/services/social-feed.ts
import { prisma } from "@/core/prisma";

/* =========================================================
   📰 Social Feed Service

   - Crear entries automáticas (achievements, level ups, etc.)
   - Query de feed con paginación cursor-based
   - Helpers para feed de usuario y comunidad
========================================================= */

/* =========================================================
   🤖 Auto-generar feed entry
   Llamar desde gamification y social events
========================================================= */
export async function createAutoFeedEntry(params: {
  authorId: string;
  type: "achievement" | "level_up" | "streak" | "noble_goal" | "connection";
  sourceType: string;
  sourceId: string;
  content: string;
  metadata?: Record<string, unknown>;
  communityId?: string;
  visibility?: string;
}): Promise<any> {
  const {
    authorId,
    type,
    sourceType,
    sourceId,
    content,
    metadata,
    communityId,
    visibility = "public",
  } = params;

  try {
    const entry = await prisma.rowiFeed.create({
      data: {
        authorId,
        content,
        type,
        sourceType,
        sourceId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        communityId: communityId || undefined,
        visibility,
        mood: type === "achievement" ? "proud" : type === "level_up" ? "excited" : undefined,
        tags: [type, sourceType].filter(Boolean),
      },
    });

    console.log(`📰 Auto feed entry: ${type} for user ${authorId}`);
    return entry;
  } catch (err) {
    console.error("❌ Error creating auto feed entry:", err);
    throw err;
  }
}

/* =========================================================
   🔍 Obtener feed del usuario (cursor-based pagination)
========================================================= */
export async function getUserFeed(params: {
  userId: string;
  cursor?: string;
  limit?: number;
  communityId?: string;
  type?: string;
}): Promise<{ items: any[]; nextCursor?: string }> {
  const { userId, cursor, limit = 20, communityId, type } = params;

  try {
    // Obtener conexiones activas
    const relations = await prisma.rowiRelation.findMany({
      where: {
        OR: [{ initiatorId: userId }, { receiverId: userId }],
        status: "active",
      },
      select: { initiatorId: true, receiverId: true },
    });

    const connectionIds = relations.map((r) =>
      r.initiatorId === userId ? r.receiverId : r.initiatorId
    );

    // Obtener comunidades del usuario
    const userCommunities = await prisma.rowiCommunityUser.findMany({
      where: { userId },
      select: { communityId: true },
    });
    const communityIds = userCommunities.map((c) => c.communityId);

    // Construir query
    const where: any = {};

    if (communityId) {
      // Feed de comunidad específica
      where.communityId = communityId;
    } else {
      // Feed personal: mis posts + conexiones + comunidades
      where.OR = [
        { authorId: { in: [userId, ...connectionIds] } },
        ...(communityIds.length > 0
          ? [{ communityId: { in: communityIds } }]
          : []),
      ];
      // No mostrar posts privados de otros
      where.NOT = {
        AND: [
          { authorId: { not: userId } },
          { visibility: "private" },
        ],
      };
    }

    if (type) {
      where.type = type;
    }

    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const items = await prisma.rowiFeed.findMany({
      where,
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
          take: 3,
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        feedReactions: {
          select: {
            id: true,
            userId: true,
            type: true,
          },
        },
        _count: {
          select: {
            feedComments: true,
            feedReactions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1, // +1 para saber si hay más
    });

    // Procesar resultados
    const hasMore = items.length > limit;
    const feedItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore
      ? feedItems[feedItems.length - 1]?.createdAt.toISOString()
      : undefined;

    // Enriquecer con datos de reacciones
    const enrichedItems = feedItems.map((item) => {
      const reactionsByType = item.feedReactions.reduce(
        (acc: Record<string, number>, r: any) => {
          acc[r.type] = (acc[r.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const userReacted = item.feedReactions.find(
        (r: any) => r.userId === userId
      );

      return {
        ...item,
        reactionsByType,
        userReaction: userReacted?.type || null,
        commentCount: item._count.feedComments,
        reactionCount: item._count.feedReactions,
      };
    });

    return { items: enrichedItems, nextCursor };
  } catch (err) {
    console.error("❌ Error getting user feed:", err);
    throw err;
  }
}
