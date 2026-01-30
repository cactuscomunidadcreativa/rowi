import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/* =========================================================
   🔸 PATCH/PUT — Editar comunidad
   ---------------------------------------------------------
   Usa await params, evita sobrescribir valores vacíos
========================================================= */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ communityId: string }> }
) {
  const { communityId } = await context.params;

  try {
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
   Usa await params para evitar warning en Next 15
========================================================= */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ communityId: string }> }
) {
  const { communityId } = await context.params;

  try {
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