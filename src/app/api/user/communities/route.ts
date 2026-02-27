// src/app/api/user/communities/route.ts
// Endpoint para obtener las comunidades del usuario autenticado
// Incluye visibilidad descendente: si perteneces a una comunidad padre,
// también ves todas sus sub-comunidades en "Mis comunidades".
import { prisma } from "@/core/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

/** Campos incluidos en cada comunidad */
const communityInclude = {
  _count: { select: { members: true, posts: true, subCommunities: true } },
  hub: { select: { id: true, name: true } },
  tenant: { select: { id: true, name: true } },
  superHub: { select: { id: true, name: true } },
  organization: { select: { id: true, name: true } },
  superCommunity: { select: { id: true, name: true, slug: true } },
} as const;

/**
 * Obtiene TODOS los IDs de sub-comunidades descendientes de un conjunto
 * de comunidades padre. Recorre la jerarquía superId hacia abajo
 * hasta un máximo de 10 niveles (safety).
 */
async function getDescendantCommunityIds(parentIds: string[]): Promise<string[]> {
  const allDescendants: string[] = [];
  let currentParentIds = [...parentIds];
  let depth = 0;
  const MAX_DEPTH = 10;

  while (currentParentIds.length > 0 && depth < MAX_DEPTH) {
    const children = await prisma.rowiCommunity.findMany({
      where: { superId: { in: currentParentIds } },
      select: { id: true },
    });

    const childIds = children.map((c) => c.id);
    // Filtrar los que ya conocemos (evitar ciclos)
    const newIds = childIds.filter(
      (id) => !allDescendants.includes(id) && !parentIds.includes(id)
    );

    if (newIds.length === 0) break;

    allDescendants.push(...newIds);
    currentParentIds = newIds;
    depth++;
  }

  return allDescendants;
}

/**
 * GET /api/user/communities
 * Retorna las comunidades a las que pertenece el usuario autenticado
 * + todas las sub-comunidades descendientes (visibilidad descendente)
 *
 * Query params:
 *   ?communityId=xxx  → incluye la lista de miembros de esa comunidad
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub || !token?.email) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get("communityId");

    // ─── Si piden miembros de una comunidad específica ───
    if (communityId) {
      // Verificar que el usuario pertenece a esta comunidad
      // o a una comunidad padre de esta
      const membership = await prisma.rowiCommunityUser.findUnique({
        where: {
          userId_communityId: {
            userId: token.sub,
            communityId,
          },
        },
      });

      // Si no es miembro directo, verificar si pertenece a un padre
      let hasAccess = !!membership;
      if (!hasAccess) {
        // Caminar hacia arriba en la jerarquía para ver si el usuario
        // pertenece a alguna comunidad padre
        let checkId = communityId;
        for (let d = 0; d < 10; d++) {
          const parent: { superId: string | null } | null =
            await prisma.rowiCommunity.findUnique({
              where: { id: checkId },
              select: { superId: true },
            });
          if (!parent?.superId) break;
          const parentMember = await prisma.rowiCommunityUser.findUnique({
            where: {
              userId_communityId: {
                userId: token.sub,
                communityId: parent.superId,
              },
            },
          });
          if (parentMember) {
            hasAccess = true;
            break;
          }
          checkId = parent.superId;
        }
      }

      if (!hasAccess) {
        return NextResponse.json(
          { ok: false, error: "No perteneces a esta comunidad" },
          { status: 403 }
        );
      }

      const members = await prisma.rowiCommunityUser.findMany({
        where: { communityId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              country: true,
              language: true,
            },
          },
        },
        orderBy: [
          { role: "asc" },
          { joinedAt: "asc" },
        ],
      });

      const enrichedMembers = members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user?.name || m.name || m.email?.split("@")[0] || "—",
        email: m.user?.email || m.email || "—",
        image: m.user?.image || null,
        country: m.user?.country || null,
        role: m.role || "member",
        status: m.status || "active",
        joinedAt: m.joinedAt,
      }));

      return NextResponse.json({
        ok: true,
        members: enrichedMembers,
        total: enrichedMembers.length,
      });
    }

    // ─── Lista de comunidades del usuario (directas + descendientes) ───

    // 1️⃣ Comunidades directas del usuario
    const memberships = await prisma.rowiCommunityUser.findMany({
      where: { userId: token.sub },
      include: {
        community: { include: communityInclude },
      },
      orderBy: { joinedAt: "desc" },
    });

    const directCommunities = memberships.map((m) => ({
      ...m.community,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
      _membership: "direct" as const,
    }));

    const directIds = directCommunities.map((c) => c.id);

    // 2️⃣ Sub-comunidades descendientes (visibilidad descendente)
    const descendantIds = await getDescendantCommunityIds(directIds);
    // Filtrar las que ya están en directas
    const newDescendantIds = descendantIds.filter((id) => !directIds.includes(id));

    let inheritedCommunities: any[] = [];
    if (newDescendantIds.length > 0) {
      const descendants = await prisma.rowiCommunity.findMany({
        where: { id: { in: newDescendantIds } },
        include: communityInclude,
      });

      inheritedCommunities = descendants.map((c) => ({
        ...c,
        role: "viewer", // Acceso heredado = solo visualización
        status: "active",
        joinedAt: null,
        _membership: "inherited" as const,
      }));
    }

    // 3️⃣ Unir: directas + heredadas (sin duplicados)
    const allCommunities = [...directCommunities, ...inheritedCommunities];

    return NextResponse.json({
      ok: true,
      communities: allCommunities,
      total: allCommunities.length,
    });
  } catch (err: any) {
    console.error("❌ Error GET /api/user/communities:", err);
    return NextResponse.json(
      { ok: false, error: "Error al obtener comunidades" },
      { status: 500 }
    );
  }
}
