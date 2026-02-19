// src/app/api/user/communities/route.ts
// Endpoint para obtener las comunidades del usuario autenticado
import { prisma } from "@/core/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

/**
 * GET /api/user/communities
 * Retorna las comunidades a las que pertenece el usuario autenticado
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub || !token?.email) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const memberships = await prisma.rowiCommunityUser.findMany({
      where: { userId: token.sub },
      include: {
        community: {
          include: {
            _count: { select: { members: true, posts: true } },
            hub: { select: { id: true, name: true } },
            tenant: { select: { id: true, name: true } },
            superHub: { select: { id: true, name: true } },
            organization: { select: { id: true, name: true } },
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
