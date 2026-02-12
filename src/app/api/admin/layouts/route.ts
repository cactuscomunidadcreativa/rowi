import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/* =========================================================
   📄 GET — Listar todos los layouts
========================================================= */
export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const layouts = await prisma.layout.findMany({
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        superHub: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // ✅ Estructura base mínima garantizada
    const enriched = layouts.map((l) => ({
      ...l,
      structure: l.structure ?? {
        zones: {
          header: { components: [] },
          main: { components: [] },
          footer: { components: [] },
        },
      },
    }));

    return NextResponse.json({ ok: true, layouts: enriched });
  } catch (err: any) {
    console.error("❌ Error GET /admin/layouts:", err);
    return NextResponse.json(
      { ok: false, error: "Error al obtener layouts" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Crear nuevo layout
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const body = await req.json();

    // 🧩 Estructura base por defecto
    const defaultStructure = {
      zones: {
        header: { components: [] },
        main: { components: [] },
        footer: { components: [] },
      },
    };

    const layout = await prisma.layout.create({
      data: {
        name: body.name || "Nuevo Layout",
        description: body.description || "",
        structure: body.structure || defaultStructure,
        theme: body.theme || {},
        previewUrl: body.previewUrl || null,
        tenantId: body.tenantId || null,
        superHubId: body.superHubId || null,
        organizationId: body.organizationId || null,
        isDefault: body.isDefault || false,
      },
    });

    return NextResponse.json({ ok: true, layout });
  } catch (err: any) {
    console.error("❌ Error POST /admin/layouts:", err);
    return NextResponse.json(
      { ok: false, error: "Error al crear layout" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✏️ PATCH — Actualizar layout existente
========================================================= */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        { ok: false, error: "ID requerido" },
        { status: 400 }
      );
    }

    // 🧩 Validar estructura
    const structure = body.structure || {
      zones: {
        header: { components: [] },
        main: { components: [] },
        footer: { components: [] },
      },
    };

    const layout = await prisma.layout.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description,
        structure,
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
    console.error("❌ Error PATCH /admin/layouts:", err);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar layout" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE — Eliminar layout
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "ID requerido" },
        { status: 400 }
      );
    }

    await prisma.layout.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: "Layout eliminado 🗑️" });
  } catch (err: any) {
    console.error("❌ Error DELETE /admin/layouts:", err);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar layout" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ⚙️ POST /api/admin/layouts/scan — Escaneo automático
   (busca layouts y componentes base en el proyecto)
========================================================= */
export async function POST_SCAN() {
  try {
    console.log("🧩 Escaneando layouts y componentes base...");
    // Aquí podrías conectar ensureLayouts() o ensureComponents() más adelante
    return NextResponse.json({
      ok: true,
      layouts: { created: 0, updated: 0 },
      components: { created: 0, updated: 0 },
    });
  } catch (err: any) {
    console.error("❌ Error en POST_SCAN /layouts:", err);
    return NextResponse.json(
      { ok: false, error: "Error durante el escaneo" },
      { status: 500 }
    );
  }
}