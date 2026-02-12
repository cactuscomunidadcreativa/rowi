import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/* =========================================================
   🔍 GET — Listar componentes globales y jerárquicos
========================================================= */
export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const components = await prisma.component.findMany({
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        superHub: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true } },
        usedInPages: { select: { id: true, pageId: true } },
        usedInLayouts: { select: { id: true, layoutId: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    return NextResponse.json({ ok: true, components });
  } catch (error: any) {
    console.error("❌ Error GET /admin/components:", error);
    return NextResponse.json({ ok: false, error: "Error al listar componentes" }, { status: 500 });
  }
}

/* =========================================================
   ✏️ PATCH — Editar componente
========================================================= */
export async function PATCH(req: Request) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const data = await req.json();
    const { id, ...updates } = data;

    const updated = await prisma.component.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, component: updated });
  } catch (error: any) {
    console.error("❌ Error PATCH /admin/components:", error);
    return NextResponse.json({ ok: false, error: "Error al actualizar componente" }, { status: 500 });
  }
}

/* =========================================================
   ➕ POST — Crear nuevo componente
========================================================= */
export async function POST(req: Request) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const data = await req.json();
    const component = await prisma.component.create({ data });
    return NextResponse.json({ ok: true, component });
  } catch (error: any) {
    console.error("❌ Error POST /admin/components:", error);
    return NextResponse.json({ ok: false, error: "Error al crear componente" }, { status: 500 });
  }
}

/* =========================================================
   🗑️ DELETE — Eliminar componente
========================================================= */
export async function DELETE(req: Request) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id } = await req.json();
    await prisma.component.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: "Componente eliminado" });
  } catch (error: any) {
    console.error("❌ Error DELETE /admin/components:", error);
    return NextResponse.json({ ok: false, error: "Error al eliminar componente" }, { status: 500 });
  }
}