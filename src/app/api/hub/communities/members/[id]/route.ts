import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";
import { ensureCanAdminMember } from "@/lib/communities/adminGuard";

export const runtime = "nodejs";

/**
 * =========================================================
 * 🔹 GET — Detalle de un miembro individual
 * ---------------------------------------------------------
 * Devuelve información completa de un RowiCommunityUser:
 *  - datos del miembro
 *  - comunidad
 *  - snapshot SEI más reciente (si existe)
 * 🔐 Expone PII + EqSnapshot SEI: exige ser admin de la comunidad.
 * =========================================================
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const guard = await ensureCanAdminMember(id);
  if (guard) return guard;

  try {
    const member = await prisma.rowiCommunityUser.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, image: true } },
        community: { select: { id: true, name: true } },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    // 🔹 buscar su último snapshot SEI (si existe)
    const lastSnapshot = await prisma.eqSnapshot.findFirst({
      where: { memberId: id },
      orderBy: { at: "desc" },
      include: {
        outcomes: { select: { key: true, label: true, score: true } },
        subfactors: { select: { key: true, label: true, score: true } },
        success: { select: { key: true, label: true, score: true } },
      },
    });

    // 🔹 preparar respuesta
    const data = {
      id: member.id,
      role: member.role,
      status: member.status,
      community: member.community?.name || "—",
      name: member.user?.name || "—",
      email: member.user?.email || "—",
      image: member.user?.image || null,
      joinedAt: member.joinedAt,
      lastSnapshot: lastSnapshot || null,
    };

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("❌ Error GET /communities/members/[id]:", err);
    return NextResponse.json(
      { error: "Error al obtener miembro" },
      { status: 500 }
    );
  }
}