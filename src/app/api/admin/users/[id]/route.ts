import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";

/* =========================================================
   🧠 GET → Detalle de usuario
   ---------------------------------------------------------
   - SUPERADMIN: puede ver cualquier usuario
   - ADMIN: solo puede ver usuarios de su tenant
========================================================= */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // ✅ Next 15 exige await

  const auth = await getServerAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actor = await prisma.user.findUnique({ where: { id: auth.id } });
  if (!actor || !["SUPERADMIN", "ADMIN"].includes(actor.organizationRole || ""))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        memberships: { include: { tenant: true } },
        hubMemberships: { include: { hub: true } },
        aiControls: true,
        permissions: true,
        plan: true,
        primaryTenant: true,
      },
    });

    if (!user)
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });

    if (actor.organizationRole === "ADMIN" && user.primaryTenantId !== actor.primaryTenantId)
      return NextResponse.json({ ok: false, error: "No autorizado para ver este usuario" }, { status: 403 });

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    console.error("❌ Error GET /api/admin/users/[id]:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

/* =========================================================
   ✏️ PATCH → Actualizar usuario
   ---------------------------------------------------------
   - SUPERADMIN: puede editar todo
   - ADMIN: solo campos básicos en su tenant
========================================================= */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // ✅ Next 15 exige await

  const auth = await getServerAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actor = await prisma.user.findUnique({ where: { id: auth.id } });
  if (!actor || !["SUPERADMIN", "ADMIN"].includes(actor.organizationRole || ""))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user)
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });

    // ADMIN solo puede modificar usuarios de su tenant
    if (actor.organizationRole === "ADMIN" && user.primaryTenantId !== actor.primaryTenantId)
      return NextResponse.json({ ok: false, error: "No autorizado para modificar este usuario" }, { status: 403 });

    const body = await req.json();

    // Campos editables según rol
    const data: any = {
      name: body.name,
      email: body.email?.toLowerCase(),
      active: body.active,
      allowAI: body.allowAI,
    };

    if (actor.organizationRole === "SUPERADMIN") {
      if (body.organizationRole) data.organizationRole = body.organizationRole;
      if (body.planId) data.planId = body.planId;
      if (body.planExpiresAt) data.planExpiresAt = new Date(body.planExpiresAt);
      if (body.primaryTenantId) data.primaryTenantId = body.primaryTenantId;
    }

    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        allowAI: true,
        organizationRole: true,
        planId: true,
        planExpiresAt: true,
        primaryTenantId: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      user: updated,
      message: "Usuario actualizado correctamente ✅",
    });
  } catch (e: any) {
    console.error("❌ Error PATCH /api/admin/users/[id]:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

/* =========================================================
   🗑️ DELETE → Eliminar / desactivar usuario
   ---------------------------------------------------------
   - SUPERADMIN: elimina físicamente
   - ADMIN: solo desactiva usuarios de su tenant
========================================================= */
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // ✅ Next 15 exige await

  const auth = await getServerAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actor = await prisma.user.findUnique({ where: { id: auth.id } });
  if (!actor || !["SUPERADMIN", "ADMIN"].includes(actor.organizationRole || ""))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user)
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });

    if (actor.organizationRole === "ADMIN" && user.primaryTenantId !== actor.primaryTenantId)
      return NextResponse.json({ ok: false, error: "No autorizado para eliminar este usuario" }, { status: 403 });

    if (actor.organizationRole === "SUPERADMIN") {
      await prisma.user.delete({ where: { id } });
      return NextResponse.json({ ok: true, message: "Usuario eliminado permanentemente ✅" });
    } else {
      await prisma.user.update({ where: { id }, data: { active: false } });
      return NextResponse.json({ ok: true, message: "Usuario desactivado temporalmente ✅" });
    }
  } catch (e: any) {
    console.error("❌ Error DELETE /api/admin/users/[id]:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

/* =========================================================
   ⚙️ Configuración runtime
========================================================= */
export const dynamic = "force-dynamic";
export const preferredRegion = "auto";