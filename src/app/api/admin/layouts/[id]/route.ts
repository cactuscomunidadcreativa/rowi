import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

/* =========================================================
   📄 GET — Obtener un layout por ID
========================================================= */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const layout = await prisma.layout.findUnique({
      where: { id: params.id },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        superHub: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    if (!layout) {
      return NextResponse.json(
        { ok: false, error: "Layout no encontrado" },
        { status: 404 }
      );
    }

    // ✅ Garantizar estructura base mínima
    const structure =
      layout.structure ||
      {
        zones: {
          header: { components: [] },
          main: { components: [] },
          footer: { components: [] },
        },
      };

    return NextResponse.json({ ok: true, layout: { ...layout, structure } });
  } catch (err: any) {
    console.error("❌ Error GET /admin/layouts/[id]:", err);
    return NextResponse.json(
      { ok: false, error: "Error al obtener layout" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✏️ PATCH — Actualizar layout por ID
========================================================= */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const layout = await prisma.layout.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        structure: body.structure || {},
        theme: body.theme || {},
        previewUrl: body.previewUrl || null,
        tenantId: body.tenantId || null,
        superHubId: body.superHubId || null,
        organizationId: body.organizationId || null,
        isDefault: body.isDefault ?? false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, layout });
  } catch (err: any) {
    console.error("❌ Error PATCH /admin/layouts/[id]:", err);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar layout" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE — Eliminar layout por ID
========================================================= */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.layout.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true, message: "Layout eliminado" });
  } catch (err: any) {
    console.error("❌ Error DELETE /admin/layouts/[id]:", err);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar layout" },
      { status: 500 }
    );
  }
}