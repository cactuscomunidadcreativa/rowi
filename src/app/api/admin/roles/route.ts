import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";

/* =========================================================
   🔍 GET — Listar todos los roles
========================================================= */
export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const roles = await prisma.roleDynamic.findMany({
      include: {
        hub: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true } },
        superHub: { select: { id: true, name: true } },
        plan: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(roles);
  } catch (error: any) {
    console.error("❌ Error GET /roles:", error);
    return NextResponse.json(
      { error: "Error al listar roles" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Crear nuevo rol
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const data = await req.json();

    const newRole = await prisma.roleDynamic.create({
      data: {
        name: data.name,
        description: data.description || null,
        permissions: data.permissions || "[]",
        color: data.color || "#4f46e5",
        icon: data.icon || "Sparkles",
        level: data.level || "HUB",
        hubId: data.hubId || null,
        tenantId: data.tenantId || null,
        superHubId: data.superHubId || null,
        planId: data.planId || null,
      },
    });

    return NextResponse.json(newRole);
  } catch (error: any) {
    console.error("❌ Error POST /roles:", error);
    return NextResponse.json(
      { error: "Error al crear rol" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✏️ PUT — Editar rol existente
========================================================= */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const data = await req.json();
    const { id } = data;

    if (!id)
      return NextResponse.json(
        { error: "Falta el ID del rol" },
        { status: 400 }
      );

    const existing = await prisma.roleDynamic.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json(
        { error: "Rol no encontrado" },
        { status: 404 }
      );

    const updated = await prisma.roleDynamic.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        description: data.description ?? existing.description,
        permissions: data.permissions ?? existing.permissions,
        color: data.color ?? existing.color,
        icon: data.icon ?? existing.icon,
        level: data.level ?? existing.level,
        hubId: data.hubId ?? existing.hubId,
        tenantId: data.tenantId ?? existing.tenantId,
        superHubId: data.superHubId ?? existing.superHubId,
        planId: data.planId ?? existing.planId,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("❌ Error PUT /roles:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "No se encontró el rol para actualizar" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar rol" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE — Eliminar rol
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id } = await req.json();
    if (!id)
      return NextResponse.json(
        { error: "Falta el ID del rol" },
        { status: 400 }
      );

    const existing = await prisma.roleDynamic.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json(
        { error: "Rol no encontrado" },
        { status: 404 }
      );

    await prisma.roleDynamic.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Error DELETE /roles:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "No se encontró el rol a eliminar" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al eliminar rol" },
      { status: 500 }
    );
  }
}