// src/app/api/hub/superhubs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";
import { canAccess } from "@/core/auth/hasAccess";

/* =========================================================
   INCLUDE correcto según tu modelo Prisma
========================================================= */
const superHubInclude = {
  hubs: {
    select: { id: true, name: true, slug: true, tenantId: true },
  },
  tenants: {
    select: { id: true, name: true, slug: true },
  },
  organizations: {
    select: { id: true, name: true, slug: true },
  },
  rolesDynamic: {
    select: { id: true, name: true, level: true },
  },
};

/* =========================================================
   🔍 GET — Listar SuperHubs según permisos
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    const userId = auth?.id ?? null;

    // 1️⃣ Sin sesión → nada
    if (!userId) {
      return NextResponse.json([]);
    }

    // 2️⃣ SuperAdmin → ver TODOS
    if (auth?.isSuperAdmin) {
      const superhubs = await prisma.superHub.findMany({
        include: superHubInclude,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(superhubs); // 👈 ARRAY directo
    }

    // 3️⃣ Si el usuario tiene SuperHubs asignados (via superHubs) → ver solo esos
    const superHubIds = (auth?.superHubs || [])
      .map((sh) => sh?.id)
      .filter((id): id is string => Boolean(id));
    if (superHubIds.length > 0) {
      const superhubs = await prisma.superHub.findMany({
        where: { id: { in: superHubIds } },
        include: superHubInclude,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(superhubs);
    }

    // 4️⃣ Otros usuarios → array vacío
    return NextResponse.json([]);
  } catch (err: any) {
    console.error("❌ Error GET /api/hub/superhubs:", err);
    return NextResponse.json(
      { ok: false, error: "Error al obtener SuperHubs" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Crear nuevo SuperHub  (solo SuperAdmin)
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.isSuperAdmin)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const data = await req.json();

    if (!data.name)
      return NextResponse.json({ error: "Falta 'name'" }, { status: 400 });

    const slug =
      data.slug?.toLowerCase().replace(/\s+/g, "-") ??
      data.name.toLowerCase().replace(/\s+/g, "-");

    const exists = await prisma.superHub.findUnique({ where: { slug } });
    if (exists)
      return NextResponse.json({ error: "El slug ya existe" }, { status: 409 });

    // Buscar System y RowiVerse dinámicamente
    const system = await prisma.system.findFirst({ where: { slug: "rowi" } });
    const rowiverse = await prisma.rowiVerse.findFirst({ where: { slug: "rowiverse" } });

    const newSH = await prisma.superHub.create({
      data: {
        name: data.name,
        slug,
        description: data.description || "",
        vision: data.vision || "",
        mission: data.mission || "",
        colorTheme: data.colorTheme || "#FF6B35",
        logo: data.logo || "/rowi-logo.png",
        rowiVerseId: rowiverse?.id || "rowiverse_root",
        systemId: system?.id || undefined,
      },
      include: superHubInclude,
    });

    return NextResponse.json({ ok: true, superHub: newSH }, { status: 201 });
  } catch (err: any) {
    console.error("❌ Error POST /api/hub/superhubs:", err);
    return NextResponse.json(
      { ok: false, error: "Error al crear SuperHub" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✏️ PUT — Actualizar SuperHub (solo SuperAdmin)
========================================================= */
export async function PUT(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.isSuperAdmin)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { id, ...data } = await req.json();

    if (!id)
      return NextResponse.json({ error: "Falta 'id'" }, { status: 400 });

    const updated = await prisma.superHub.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        vision: data.vision,
        mission: data.mission,
        colorTheme: data.colorTheme,
        logo: data.logo,
      },
      include: superHubInclude,
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
   🗑️ DELETE — Eliminar SuperHub (solo SuperAdmin)
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.isSuperAdmin)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { id } = await req.json();

    if (!id)
      return NextResponse.json({ error: "Falta 'id'" }, { status: 400 });

    await prisma.superHub.delete({ where: { id } });

    return NextResponse.json({ ok: true, message: "SuperHub eliminado" });
  } catch (err: any) {
    console.error("❌ Error DELETE /api/hub/superhubs:", err);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar SuperHub" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ⚙️ Configuración
========================================================= */
export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";