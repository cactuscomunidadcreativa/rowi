import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

/* =========================================================
   👥 GET — Lista todos los miembros de un Hub
========================================================= */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ hubId: string }> }
) {
  try {
    const { hubId } = await context.params;

    const hub = await prisma.hub.findUnique({ where: { id: hubId } });
    if (!hub) {
      return NextResponse.json(
        { ok: false, error: `Hub ${hubId} no encontrado` },
        { status: 404 }
      );
    }

    const members = await prisma.hubMembership.findMany({
      where: { hubId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            organizationRole: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json({ ok: true, count: members.length, members });
  } catch (e: any) {
    console.error("❌ Error en GET /api/admin/hubs/[hubId]/members:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Agrega un miembro al Hub
========================================================= */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ hubId: string }> }
) {
  const { hubId } = await context.params;
  const body = await req.json();
  const { userId } = body;

  try {
    const hub = await prisma.hub.findUnique({ where: { id: hubId } });
    if (!hub)
      return NextResponse.json(
        { ok: false, error: "Hub no encontrado" },
        { status: 404 }
      );

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado" },
        { status: 404 }
      );

    const membership = await prisma.hubMembership.create({
      data: { hubId, userId, access: "member" },
      include: { user: true },
    });

    return NextResponse.json({ ok: true, membership });
  } catch (e: any) {
    console.error("❌ Error creando miembro:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Error interno" },
      { status: 500 }
    );
  }
}