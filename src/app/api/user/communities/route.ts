// src/app/api/user/communities/route.ts
// Endpoint para obtener las comunidades del usuario autenticado
import { prisma } from "@/core/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

/**
 * GET /api/user/communities
 * Retorna las comunidades a las que pertenece el usuario autenticado
 * Incluye jerarquía padre/hijos y miembros del community seleccionado
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

    // Si piden miembros de una comunidad específica
    if (communityId) {
      // Verificar que el usuario pertenece a esta comunidad
      const membership = await prisma.rowiCommunityUser.findUnique({
        where: {
          userId_communityId: {
            userId: token.sub,
            communityId,
          },
        },
      });

      if (!membership) {
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

    // Lista de comunidades del usuario
    const memberships = await prisma.rowiCommunityUser.findMany({
      where: { userId: token.sub },
      include: {
        community: {
          include: {
            _count: { select: { members: true, posts: true, subCommunities: true } },
            hub: { select: { id: true, name: true } },
            tenant: { select: { id: true, name: true } },
            superHub: { select: { id: true, name: true } },
            organization: { select: { id: true, name: true } },
            superCommunity: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const communities = memberships.map((m) => ({
      ...m.community,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json({
      ok: true,
      communities,
      total: communities.length,
    });
  } catch (err: any) {
    console.error("❌ Error GET /api/user/communities:", err);
    return NextResponse.json(
      { ok: false, error: "Error al obtener comunidades" },
      { status: 500 }
    );
  }
}
