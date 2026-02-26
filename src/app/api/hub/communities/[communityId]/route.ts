import { prisma } from "@/core/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

/* =========================================================
   🔸 PATCH/PUT — Editar comunidad
   ---------------------------------------------------------
   Requiere autenticación. Usa await params.
========================================================= */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ communityId: string }> }
) {
  const { communityId } = await context.params;

  try {
    // Autenticación requerida
    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      description,
      visibility,
      bannerUrl,
      coverUrl,
      category,
      teamType,
      superId,
      hubId,
      tenantId,
      superHubId,
      organizationId,
    } = body;

    const updated = await prisma.rowiCommunity.update({
      where: { id: communityId },
      data: {
        name: name ?? undefined,
        slug: slug ?? undefined,
        description: description ?? undefined,
        visibility: visibility ?? undefined,
        bannerUrl: bannerUrl ?? undefined,
        coverUrl: coverUrl ?? undefined,
        category: category ?? undefined,
        teamType: teamType ?? undefined,
        superId: superId !== undefined ? (superId || null) : undefined,
        hubId: hubId ?? undefined,
        tenantId: tenantId ?? undefined,
        superHubId: superHubId ?? undefined,
        organizationId: organizationId ?? undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("❌ Error PATCH /hub/communities/[communityId]:", err);
    return NextResponse.json(
      { error: "Error al actualizar comunidad" },
      { status: 500 }
    );
  }
}

// Alias PUT → PATCH
export { PATCH as PUT };

/* =========================================================
   🔻 DELETE — Eliminar comunidad
   ---------------------------------------------------------
   Requiere autenticación. Usa await params.
========================================================= */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ communityId: string }> }
) {
  const { communityId } = await context.params;

  try {
    // Autenticación requerida
    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.rowiCommunity.delete({
      where: { id: communityId },
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ Error DELETE /hub/communities/[communityId]:", err);
    return NextResponse.json(
      { error: "Error al eliminar comunidad" },
      { status: 500 }
    );
  }
}
