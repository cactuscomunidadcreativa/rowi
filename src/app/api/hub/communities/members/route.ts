import { prisma } from "@/core/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

export const runtime = "nodejs";

/**
 * =========================================================
 * 🔹 GET — Listar miembros de una comunidad
 * ---------------------------------------------------------
 * Devuelve los miembros (RowiCommunityUser) con:
 *  - datos del usuario si está vinculado
 *  - nombre, email y país desde EqSnapshot si existe
 *
 * Query params:
 *  - communityId: ID de la comunidad (requerido)
 *
 * 🔐 Autorización:
 *  - El solicitante debe ser miembro de la comunidad,
 *    o ser super admin.
 * =========================================================
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.success) return auth.error;

    // Obtener communityId de query params
    const searchParams = req.nextUrl.searchParams;
    const communityId = searchParams.get("communityId");

    if (!communityId) {
      return NextResponse.json(
        { error: "communityId is required" },
        { status: 400 }
      );
    }

    // 🔐 Membership check: el usuario debe pertenecer a la comunidad o ser super admin
    if (!auth.user.isSuperAdmin) {
      const isMember = await prisma.rowiCommunityUser.findFirst({
        where: { communityId, userId: auth.user.id },
        select: { id: true },
      });
      if (!isMember) {
        return NextResponse.json(
          { error: "No autorizado para ver los miembros de esta comunidad" },
          { status: 403 }
        );
      }
    }

    const members = await prisma.rowiCommunityUser.findMany({
      where: { communityId },
      orderBy: { joinedAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            active: true,
            allowAI: true,
          },
        },
      },
    });

    // 🔹 Enriquecer cada miembro con snapshot (si existe)
    const enriched = await Promise.all(
      members.map(async (m) => {
        const snapshot = await prisma.eqSnapshot.findFirst({
          where: { memberId: m.id },
          orderBy: { at: "desc" },
          select: {
            email: true,
            country: true,
            at: true,
            project: true,
          },
        });

        return {
          id: m.id,
          role: m.role,
          status: m.status,
          joinedAt: m.joinedAt,
          user: m.user,
          name: m.user?.name || "—",
          email: m.user?.email || snapshot?.email || "—",
          country: snapshot?.country || "—",
          lastAssessment: snapshot?.at
            ? new Date(snapshot.at).toLocaleDateString("es-PE", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "—",
          project: snapshot?.project || "—",
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (err: any) {
    console.error("❌ Error GET /hub/communities/members:", err);
    return NextResponse.json(
      { error: "Error al obtener miembros" },
      { status: 500 }
    );
  }
}
