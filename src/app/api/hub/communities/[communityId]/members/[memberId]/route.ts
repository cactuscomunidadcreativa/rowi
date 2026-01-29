import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * =========================================================
 * 🔹 GET — Detalle de un miembro (por ID)
 * ---------------------------------------------------------
 * Devuelve info del RowiCommunityUser + comunidad + snapshot
 * =========================================================
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await context.params;

  try {
    // 🔹 Buscar al miembro
    const member = await prisma.rowiCommunityUser.findUnique({
      where: { id: memberId },
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

    // 🔹 Buscar último snapshot (si existe)
    const snapshot = await prisma.eqSnapshot.findFirst({
      where: { userId: member.userId ?? undefined }, // ✅ usamos userId en lugar de memberId
      orderBy: { at: "desc" },
      select: {
        email: true,
        project: true,
        at: true,
      },
    });

    // 🔹 Construir respuesta combinada
    const data = {
      id: member.id,
      role: member.role,
      status: member.status,
      communityName: member.community?.name || "—",
      name: member.user?.name || "—",
      email: member.user?.email || snapshot?.email || "—",
      image: member.user?.image || null,
      lastProject: snapshot?.project || "—",
      lastAssessment: snapshot?.at
        ? new Date(snapshot.at).toLocaleDateString("es-PE", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "—",
    };

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("❌ Error GET /communities/members/[memberId]:", err);
    return NextResponse.json(
      { error: "Error al obtener miembro" },
      { status: 500 }
    );
  }
}