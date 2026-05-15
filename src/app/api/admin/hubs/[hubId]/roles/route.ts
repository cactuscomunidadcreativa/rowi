import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { scopeCanAdminHub } from "@/core/admin/hubScope";

/**
 * =========================================================
 * 🧩 ADMIN / HUBS / [hubId] / ROLES
 * ---------------------------------------------------------
 * Roles dinámicos asociados a un Hub específico.
 * Soporta:
 *   • GET — listar roles por Hub
 *   • POST — crear nuevo rol
 * =========================================================
 */

// 🔹 GET → Listar roles dinámicos por Hub
export async function GET(
  _req: Request,
  context: { params: Promise<{ hubId: string }> }
) {
  try {
    const auth = await requireAdminWithScope();
    if (auth.error) return auth.error;

    const { hubId } = await context.params;
    if (!(await scopeCanAdminHub(auth.scope, hubId))) {
      return NextResponse.json(
        { ok: false, error: "Hub fuera de tu scope" },
        { status: 403 },
      );
    } // ✅ await es clave en Next 15

    const roles = await prisma.hubRoleDynamic.findMany({
      where: { hubId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      roles.map((r) => ({
        ...r,
        permissions: r.permissions ? JSON.stringify(r.permissions) : "[]",
      })),
      { headers: { "cache-control": "no-store" } }
    );
  } catch (error: any) {
    console.error("❌ Error GET /hubs/[hubId]/roles:", error);
    return NextResponse.json(
      { ok: false, error: "Error al listar roles del Hub" },
      { status: 500 }
    );
  }
}

// 🔹 POST → Crear un nuevo rol dinámico
export async function POST(
  req: Request,
  context: { params: Promise<{ hubId: string }> }
) {
  try {
    const auth = await requireAdminWithScope();
    if (auth.error) return auth.error;

    const { hubId } = await context.params;
    if (!(await scopeCanAdminHub(auth.scope, hubId))) {
      return NextResponse.json(
        { ok: false, error: "Hub fuera de tu scope" },
        { status: 403 },
      );
    }
    const body = await req.json();

    const permissions = (() => {
      try {
        return body.permissions ? JSON.parse(body.permissions) : [];
      } catch {
        return [];
      }
    })();

    const role = await prisma.hubRoleDynamic.create({
      data: {
        hubId,
        name: body.name,
        permissions,
        color: body.color ?? null,
        icon: body.icon ?? null,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Rol creado correctamente ✅",
      role,
    });
  } catch (error: any) {
    console.error("❌ Error POST /hubs/[hubId]/roles:", error);
    return NextResponse.json(
      { ok: false, error: "Error al crear rol" },
      { status: 500 }
    );
  }
}