import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { scopeCanAdminHub } from "@/core/admin/hubScope";

/**
 * =========================================================
 * 🧩 ADMIN / HUBS / [hubId] / ROLES / [roleId]
 * ---------------------------------------------------------
 * Endpoint para editar o eliminar un rol dinámico de un Hub.
 * Soporta:
 *   • PATCH — Actualizar un rol existente
 *   • DELETE — Eliminar un rol existente
 * =========================================================
 */

// 🔹 PATCH → Editar un rol dinámico
export async function PATCH(
  req: Request,
  context: { params: Promise<{ hubId: string; roleId: string }> }
) {
  try {
    const auth = await requireAdminWithScope();
    if (auth.error) return auth.error;

    const { hubId, roleId } = await context.params;
    if (!(await scopeCanAdminHub(auth.scope, hubId))) {
      return NextResponse.json(
        { ok: false, error: "Hub fuera de tu scope" },
        { status: 403 },
      );
    }
    const body = await req.json();

    const permissions =
      typeof body.permissions === "string"
        ? JSON.parse(body.permissions)
        : body.permissions;

    const updated = await prisma.hubRoleDynamic.update({
      where: { id: roleId },
      data: {
        name: body.name ?? undefined,
        permissions: permissions ?? undefined,
        color: body.color ?? undefined,
        icon: body.icon ?? undefined,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Rol actualizado correctamente ✅",
      role: updated,
    });
  } catch (error: any) {
    console.error("❌ Error PATCH /hubs/[hubId]/roles/[roleId]:", error);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar el rol" },
      { status: 500 }
    );
  }
}

// 🔹 DELETE → Eliminar un rol dinámico
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ hubId: string; roleId: string }> }
) {
  try {
    const auth = await requireAdminWithScope();
    if (auth.error) return auth.error;

    const { hubId, roleId } = await context.params;
    if (!(await scopeCanAdminHub(auth.scope, hubId))) {
      return NextResponse.json(
        { ok: false, error: "Hub fuera de tu scope" },
        { status: 403 },
      );
    }

    await prisma.hubRoleDynamic.delete({ where: { id: roleId } });

    return NextResponse.json({
      ok: true,
      message: "Rol eliminado correctamente 🗑️",
    });
  } catch (error: any) {
    console.error("❌ Error DELETE /hubs/[hubId]/roles/[roleId]:", error);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar el rol" },
      { status: 500 }
    );
  }
}