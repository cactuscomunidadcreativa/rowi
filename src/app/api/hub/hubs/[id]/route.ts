// src/app/api/hub/hubs/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";

/**
 * ✏️ PATCH → Editar Hub existente (nombre, descripción, tenant o visibilidad)
 * ---------------------------------------------------------
 * - Permite asociar un Hub a un Tenant
 * - Valida existencia del Tenant antes de guardar
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const auth = await getServerAuthUser();
    if (!auth)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, slug, description, tenantId, superHubId, visibility } = body;

    // 🧩 Verificar que el tenant exista si se pasa un tenantId
    if (tenantId) {
      const tenantExists = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      if (!tenantExists) {
        return NextResponse.json({
          ok: false,
          error: "El tenant especificado no existe",
        });
      }
    }

    const hub = await prisma.hub.update({
      where: { id },
      data: {
        name,
        slug: slug || undefined,
        description,
        tenantId: tenantId || undefined,
        superHubId: superHubId || null,
        visibility,
      },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        superHub: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Hub actualizado correctamente ✅",
      hub,
    });
  } catch (e: any) {
    console.error("❌ Error PATCH /api/hub/hubs/[id]:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}