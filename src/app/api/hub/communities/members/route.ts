import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * =========================================================
 * 🔹 GET — Listar miembros de una comunidad
 * ---------------------------------------------------------
 * Devuelve los miembros (RowiCommunityUser) con:
 *  - datos del usuario si está vinculado
 *  - nombre, email y país desde EqSnapshot si existe
 * =========================================================
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  // ✅ FIX Next.js 14/15
  const params = await context.params;
  const id = params.id;

  try {
    const members = await prisma.rowiCommunityUser.findMany({
      where: { communityId: id },
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
    console.error("❌ Error GET /communities/[id]/members:", err);
    return NextResponse.json(
      { error: "Error al obtener miembros" },
      { status: 500 }
    );
  }
}