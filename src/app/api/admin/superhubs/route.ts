import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope, requireSuperAdmin } from "@/core/auth/requireAdmin";

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
   🧠 GET → Listar SuperHubs (scope-aware)
   ---------------------------------------------------------
   - rowiverse: todos
   - superhub admin: solo el que administra
   - hub/tenant admin: el superhub al que su tenant pertenece (si alguno)
========================================================= */
export async function GET() {
  try {
    const auth = await requireAdminWithScope();
    if (auth.error) return auth.error;

    let where: Record<string, unknown> = {};
    if (auth.scope.type === "superhub") {
      where = { id: auth.scope.id ?? undefined };
    } else if (auth.scope.type === "tenant" && auth.scope.id) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: auth.scope.id },
        select: { superHubId: true },
      });
      where = tenant?.superHubId ? { id: tenant.superHubId } : { id: "none" };
    } else if (auth.scope.type === "hub" && auth.scope.id) {
      const hub = await prisma.hub.findUnique({
        where: { id: auth.scope.id },
        select: { superHubId: true },
      });
      where = hub?.superHubId ? { id: hub.superHubId } : { id: "none" };
    }

    const superhubs = await prisma.superHub.findMany({
      where,
      include: {
        hubs: { select: { id: true, name: true, slug: true } },
        tenants: { select: { id: true, name: true, slug: true } },
        agents: { select: { id: true, name: true, type: true, model: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // 👇 Clave corregida: superHubs
    return NextResponse.json({
      ok: true,
      total: superhubs.length,
      superHubs: superhubs,
    });
  } catch (err: any) {
    console.error("❌ Error GET /api/hub/superhubs:", err);
    return NextResponse.json(
      { ok: false, error: "Error al obtener SuperHubs" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST → Crear nuevo SuperHub
   ---------------------------------------------------------
   - Genera slug automático
   - Valida duplicado
   - Sincroniza agentes IA globales
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { name, slug, description, vision, mission, colorTheme, logo } =
      await req.json();

    if (!name)
      return NextResponse.json(
        { ok: false, error: "El campo 'name' es requerido" },
        { status: 400 }
      );

    // 🧠 Slug automático
    const normalizedSlug = normSlug(slug || name);
    if (!normalizedSlug)
      return NextResponse.json({ ok: false, error: "Slug inválido" }, { status: 400 });

    // 🚫 Verificar duplicado
    const exists = await prisma.superHub.findUnique({
      where: { slug: normalizedSlug },
    });
    if (exists)
      return NextResponse.json(
        { ok: false, error: "Ya existe un SuperHub con ese slug" },
        { status: 409 }
      );

    // ✅ Crear el SuperHub
    const newHub = await prisma.superHub.create({
      data: {
        name,
        slug: normalizedSlug,
        description: description || null,
        vision: vision || null,
        mission: mission || null,
        colorTheme: colorTheme || "#FF6B35",
        logo: logo || "/rowi-logo.png",
      },
    });

    console.log(`🏛 SuperHub creado: ${newHub.name} (${newHub.slug})`);

    // 🤖 Sincronizar agentes globales
    try {
      const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const res = await fetch(`${apiUrl}/api/hub/agents/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "superhub",
          scopeId: newHub.id,
        }),
      });
      const sync = await res.json();
      console.log(
        `🤖 Agentes sincronizados para ${newHub.slug}: ${sync.created || 0} nuevos`
      );
    } catch (syncErr) {
      console.warn("⚠️ No se pudieron clonar agentes globales:", syncErr);
    }

    return NextResponse.json({ ok: true, superHub: newHub }, { status: 201 });
  } catch (err: any) {
    console.error("❌ Error POST /api/hub/superhubs:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error al crear SuperHub" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✏️ PUT → Editar un SuperHub existente
========================================================= */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id, ...data } = await req.json();

    if (!id)
      return NextResponse.json(
        { ok: false, error: "Falta el ID del SuperHub" },
        { status: 400 }
      );

    const updated = await prisma.superHub.update({
      where: { id },
      data,
    });

    return NextResponse.json({ ok: true, superHub: updated });
  } catch (err: any) {
    console.error("❌ Error PUT /api/hub/superhubs:", err);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar SuperHub" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE → Eliminar un SuperHub
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id } = await req.json();

    if (!id)
      return NextResponse.json(
        { ok: false, error: "Falta el ID del SuperHub" },
        { status: 400 }
      );

    await prisma.superHub.delete({ where: { id } });
    return NextResponse.json({
      ok: true,
      message: "SuperHub eliminado correctamente",
    });
  } catch (err: any) {
    console.error("❌ Error DELETE /api/hub/superhubs:", err);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar SuperHub" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";