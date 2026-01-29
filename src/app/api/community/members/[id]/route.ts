import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

/**
 * PATCH /api/community/members/[id]
 * ---------------------------------------------------------
 * Actualiza datos de un miembro existente.
 * Soporta tanto CommunityMember como User (tenant teammates).
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase() || null;
    if (!email)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const owner = await prisma.user.findUnique({ where: { email } });
    if (!owner)
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json();

    // Check if this is a tenant user (id starts with "user_")
    if (id.startsWith("user_")) {
      const realUserId = id.replace("user_", "");

      // Find or create a CommunityMember for this tenant user
      const tenantUser = await prisma.user.findUnique({
        where: { id: realUserId },
        select: { id: true, email: true, name: true, primaryTenantId: true },
      });

      if (!tenantUser)
        return NextResponse.json(
          { ok: false, error: "Usuario no encontrado" },
          { status: 404 }
        );

      // Check if user is in same tenant
      if (tenantUser.primaryTenantId !== owner.primaryTenantId)
        return NextResponse.json(
          { ok: false, error: "No tienes permiso para editar este usuario" },
          { status: 403 }
        );

      // Find existing CommunityMember or create one
      let communityMember = await prisma.communityMember.findFirst({
        where: {
          OR: [
            { userId: realUserId },
            { email: tenantUser.email?.toLowerCase() },
          ],
          tenantId: owner.primaryTenantId!,
        },
      });

      const allowedFieldsForUser = ["group", "closeness", "connectionType", "country"];
      const data: Record<string, any> = {};
      for (const key of allowedFieldsForUser) {
        if (body[key] !== undefined) data[key] = body[key];
      }

      if (!communityMember) {
        // Create a new CommunityMember linked to this user
        communityMember = await prisma.communityMember.create({
          data: {
            name: tenantUser.name || tenantUser.email?.split("@")[0] || "Unknown",
            email: tenantUser.email,
            userId: realUserId,
            ownerId: owner.id,
            tenantId: owner.primaryTenantId!,
            source: "tenant_link",
            status: "ACTIVE",
            ...data,
          },
        });
      } else {
        // If closeness is being updated, invalidate affinity snapshots to force recalculation
        if (body.closeness !== undefined) {
          await prisma.affinitySnapshot.deleteMany({
            where: { memberId: communityMember.id },
          });
        }

        // Update existing CommunityMember
        communityMember = await prisma.communityMember.update({
          where: { id: communityMember.id },
          data,
        });
      }

      return NextResponse.json({ ok: true, member: communityMember, affinityInvalidated: !!body.closeness });
    }

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

    // Verify the member belongs to the owner
    const existingMember = await prisma.communityMember.findUnique({
      where: { id },
      select: { ownerId: true, tenantId: true },
    });

    if (!existingMember)
      return NextResponse.json(
        { ok: false, error: "Miembro no encontrado" },
        { status: 404 }
      );

    // Check ownership: either owner created it or same tenant
    const canEdit =
      existingMember.ownerId === owner.id ||
      (existingMember.tenantId && existingMember.tenantId === owner.primaryTenantId);

    if (!canEdit)
      return NextResponse.json(
        { ok: false, error: "No tienes permiso para editar este miembro" },
        { status: 403 }
      );

    // If closeness is being updated, invalidate affinity snapshots to force recalculation
    if (body.closeness !== undefined) {
      await prisma.affinitySnapshot.deleteMany({
        where: { memberId: id },
      });
    }

    const updated = await prisma.communityMember.update({
      where: { id },
      data,
    });

    return NextResponse.json({ ok: true, member: updated, affinityInvalidated: !!body.closeness });
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
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase() || null;
    if (!email)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const owner = await prisma.user.findUnique({ where: { email } });
    if (!owner)
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });

    // Check if this is a tenant user (id starts with "user_")
    if (id.startsWith("user_")) {
      return NextResponse.json(
        { ok: false, error: "No se puede eliminar usuarios del tenant desde aquí" },
        { status: 400 }
      );
    }

    // Verify the member belongs to the owner
    const existingMember = await prisma.communityMember.findUnique({
      where: { id },
      select: { ownerId: true, tenantId: true },
    });

    if (!existingMember)
      return NextResponse.json(
        { ok: false, error: "Miembro no encontrado" },
        { status: 404 }
      );

    // Check ownership
    const canDelete =
      existingMember.ownerId === owner.id ||
      (existingMember.tenantId && existingMember.tenantId === owner.primaryTenantId);

    if (!canDelete)
      return NextResponse.json(
        { ok: false, error: "No tienes permiso para eliminar este miembro" },
        { status: 403 }
      );

    await prisma.affinitySnapshot.deleteMany({ where: { memberId: id } });
    await prisma.communityMember.delete({ where: { id } });

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