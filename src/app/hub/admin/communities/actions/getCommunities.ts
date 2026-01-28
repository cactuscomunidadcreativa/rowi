"use server";

import { prisma } from "@/core/prisma";

/**
 * =========================================================
 * 🔍 getCommunities
 * ---------------------------------------------------------
 * Devuelve la lista de comunidades asociadas a un hub,
 * tenant o superhub, ordenadas por fecha de creación.
 * =========================================================
 */
export async function getCommunities(hubId?: string, tenantId?: string, superHubId?: string) {
  try {
    const communities = await prisma.rowiCommunity.findMany({
      where: {
        ...(hubId ? { hubId } : {}),
        ...(tenantId ? { tenantId } : {}),
        ...(superHubId ? { superHubId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { members: true, posts: true } },
      },
    });

    return communities;
  } catch (err) {
    console.error("❌ Error en getCommunities:", err);
    return [];
  }
}