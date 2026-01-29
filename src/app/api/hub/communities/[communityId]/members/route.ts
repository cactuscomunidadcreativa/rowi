import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/* =========================================================
   🔹 GET — Listar miembros de una comunidad (Next 15+)
   ---------------------------------------------------------
   Usa await context.params para evitar el warning:
   "params should be awaited before using its properties"
========================================================= */
export async function GET(
  req: Request,
  context: { params: Promise<{ communityId: string }> }
) {
  const { communityId } = await context.params;

  try {
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

    return NextResponse.json(members);
  } catch (err: any) {
    console.error("❌ Error GET /hub/communities/[id]/members:", err);
    return NextResponse.json(
      { error: "Error al obtener miembros" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🔹 POST — Agregar miembro a una comunidad
========================================================= */
export async function POST(
  req: Request,
  context: { params: Promise<{ communityId: string }> }
) {
  const { communityId } = await context.params;

  try {
    const body = await req.json();
    const { userId, email, role } = body;

    // Validar comunidad
    const community = await prisma.rowiCommunity.findUnique({
      where: { id: communityId },
    });
    if (!community)
      return NextResponse.json(
        { error: "Comunidad no encontrada" },
        { status: 404 }
      );

    // Buscar o crear usuario
    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: { email, name: email.split("@")[0], active: true },
        });
      }
    }

    if (!user)
      return NextResponse.json(
        { error: "No se pudo crear o encontrar el usuario" },
        { status: 400 }
      );

    // Crear vinculación miembro
    const member = await prisma.rowiCommunityUser.create({
      data: {
        communityId,
        userId: user.id,
        role: role || "member",
        status: "active",
      },
      include: { user: true },
    });

    return NextResponse.json(member);
  } catch (err: any) {
    console.error("❌ Error POST /hub/communities/[id]/members:", err);
    return NextResponse.json(
      { error: "Error al agregar miembro" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🔹 DELETE — Eliminar miembro
========================================================= */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ communityId: string }> }
) {
  const { communityId } = await context.params;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId)
      return NextResponse.json(
        { error: "Debe especificar userId" },
        { status: 400 }
      );

    await prisma.rowiCommunityUser.deleteMany({
      where: { communityId, userId },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ Error DELETE /hub/communities/[id]/members:", err);
    return NextResponse.json(
      { error: "Error al eliminar miembro" },
      { status: 500 }
    );
  }
}