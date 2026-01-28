import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

/**
 * PATCH /api/community/members/[id]
 * ---------------------------------------------------------
 * Actualiza datos de un miembro existente.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase() || null;
    if (!email)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const owner = await prisma.user.findUnique({ where: { email } });
    if (!owner)
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json();

    const allowedFields = [
      "name",
      "email",
      "country",
      "group",
      "brainStyle",
      "closeness",
      "connectionType",
      "linkedin",
      "instagram",
      "twitter",
      "facebook",
      "website",
    ];

    const data: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    if (Object.keys(data).length === 0)
      return NextResponse.json(
        { ok: false, error: "No hay campos válidos para actualizar" },
        { status: 400 }
      );

    const updated = await prisma.communityMember.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ ok: true, member: updated });
  } catch (e: any) {
    console.error("[PATCH /community/members/[id]] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/community/members/[id]
 * ---------------------------------------------------------
 * Elimina un miembro y sus afinidades asociadas.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase() || null;
    if (!email)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const owner = await prisma.user.findUnique({ where: { email } });
    if (!owner)
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });

    await prisma.affinitySnapshot.deleteMany({ where: { memberId: params.id } });
    await prisma.communityMember.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[DELETE /community/members/[id]] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error eliminando miembro" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const preferredRegion = "auto";