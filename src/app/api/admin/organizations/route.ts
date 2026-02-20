// src/app/api/hub/organizations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/* =========================================================
   🔧 Helper — Normalizar slug
========================================================= */
function normSlug(s: string) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

/* =========================================================
   🔍 GET — Listar organizaciones con relaciones
========================================================= */
export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const orgs = await prisma.organization.findMany({
      include: {
        superHub: { select: { id: true, name: true, slug: true } },
        tenantLinks: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                plan: { select: { id: true, name: true } },
              },
            },
          },
        },
        members: { select: { id: true, role: true, userId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      total: orgs.length,
      organizations: orgs,
    });
  } catch (error: any) {
    console.error("❌ Error GET /api/hub/organizations:", error);
    return NextResponse.json(
      { ok: false, error: "Error al listar organizaciones" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Crear nueva organización
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { name, slug, description, superHubId, tenantIds = [] } = await req.json();

    if (!name)
      return NextResponse.json(
        { ok: false, error: "El campo 'name' es obligatorio" },
        { status: 400 }
      );

    const normalizedSlug = normSlug(slug || name);

    // 🚫 Evitar duplicados
    const exists = await prisma.organization.findUnique({
      where: { slug: normalizedSlug },
    });
    if (exists)
      return NextResponse.json(
        { ok: false, error: "Ya existe una organización con ese slug" },
        { status: 409 }
      );

    // 🧱 Crear organización
    const org = await prisma.organization.create({
      data: {
        name,
        slug: normalizedSlug,
        description: description || null,
        superHubId: superHubId || null,
      },
      include: { superHub: true },
    });

    // Create tenant links if provided
    if (tenantIds.length > 0) {
      await prisma.organizationToTenant.createMany({
        data: tenantIds.map((tenantId: string) => ({
          organizationId: org.id,
          tenantId,
        })),
        skipDuplicates: true,
      });
    }

    console.log(`🏢 Organización creada: ${org.name} (${org.slug})`);
    return NextResponse.json({ ok: true, organization: org }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error POST /api/hub/organizations:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al crear organización" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✏️ PUT — Editar organización + actualizar Tenants vinculados
========================================================= */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id, name, slug, description, superHubId, tenantIds = [] } = await req.json();

    if (!id)
      return NextResponse.json(
        { ok: false, error: "Falta el ID de la organización" },
        { status: 400 }
      );

    const normalizedSlug = slug ? normSlug(slug) : undefined;

    const org = await prisma.organization.update({
      where: { id },
      data: {
        name,
        slug: normalizedSlug,
        description,
        superHubId,
      },
      include: { superHub: true },
    });

    // Update tenant links
    await prisma.organizationToTenant.deleteMany({
      where: { organizationId: id },
    });
    if (tenantIds.length > 0) {
      await prisma.organizationToTenant.createMany({
        data: tenantIds.map((tenantId: string) => ({
          organizationId: id,
          tenantId,
        })),
        skipDuplicates: true,
      });
    }

    console.log(`✏️ Organización actualizada: ${org.name}`);
    return NextResponse.json({ ok: true, organization: org });
  } catch (error: any) {
    console.error("❌ Error PUT /api/hub/organizations:", error);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar organización" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE — Eliminar organización
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id } = await req.json();
    if (!id)
      return NextResponse.json(
        { ok: false, error: "Falta el ID de la organización" },
        { status: 400 }
      );

    await prisma.organization.delete({ where: { id } });
    console.log(`🗑️ Organización eliminada: ${id}`);

    return NextResponse.json({
      ok: true,
      message: "Organización eliminada correctamente",
    });
  } catch (error: any) {
    console.error("❌ Error DELETE /api/hub/organizations:", error);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar organización" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ⚙️ Configuración del endpoint
========================================================= */
export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";