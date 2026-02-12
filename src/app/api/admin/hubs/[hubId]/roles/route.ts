import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

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
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { hubId } = await context.params; // ✅ await es clave en Next 15

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
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { hubId } = await context.params;
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