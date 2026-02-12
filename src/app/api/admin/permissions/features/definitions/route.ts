// src/app/api/admin/permissions/features/definitions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/* =========================================================
   📋 API de Definiciones de Features

   Catálogo de todas las features del sistema.
   Permite agregar, editar y organizar features disponibles.
========================================================= */

/* =========================================================
   🔍 GET — Listar definiciones de features
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const isAdmin = searchParams.get("isAdmin");

    const where: any = {};
    if (category) where.category = category;
    if (isAdmin !== null) where.isAdmin = isAdmin === "true";

    const definitions = await prisma.featureDefinition.findMany({
      where,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    // Agrupar por categoría
    const categories = [...new Set(definitions.map((d) => d.category))];
    const byCategory = definitions.reduce((acc, def) => {
      const cat = def.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(def);
      return acc;
    }, {} as Record<string, typeof definitions>);

    return NextResponse.json({
      ok: true,
      total: definitions.length,
      definitions,
      categories,
      byCategory,
    });
  } catch (error: any) {
    console.error("❌ Error GET definitions:", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener definiciones" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Crear definición de feature
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const {
      key,
      name,
      description,
      category = "general",
      parentKey,
      icon,
      route,
      isAdmin = false,
      isDefault = true,
    } = await req.json();

    if (!key || !name) {
      return NextResponse.json(
        { ok: false, error: "Los campos 'key' y 'name' son obligatorios" },
        { status: 400 }
      );
    }

    // Verificar clave única
    const exists = await prisma.featureDefinition.findUnique({
      where: { key },
    });
    if (exists) {
      return NextResponse.json(
        { ok: false, error: "Ya existe una feature con esa clave" },
        { status: 409 }
      );
    }

    const definition = await prisma.featureDefinition.create({
      data: {
        key,
        name,
        description,
        category,
        parentKey,
        icon,
        route,
        isAdmin,
        isDefault,
      },
    });

    console.log(`📋 Feature definida: ${key}`);
    return NextResponse.json({ ok: true, definition }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error POST definition:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al crear definición" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✏️ PUT — Actualizar definición
========================================================= */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id, key, ...data } = await req.json();

    if (!id && !key) {
      return NextResponse.json(
        { ok: false, error: "Falta 'id' o 'key'" },
        { status: 400 }
      );
    }

    const definition = await prisma.featureDefinition.update({
      where: id ? { id } : { key },
      data,
    });

    console.log(`✏️ Feature actualizada: ${definition.key}`);
    return NextResponse.json({ ok: true, definition });
  } catch (error: any) {
    console.error("❌ Error PUT definition:", error);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar definición" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE — Eliminar definición
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id, key } = await req.json();

    if (!id && !key) {
      return NextResponse.json(
        { ok: false, error: "Falta 'id' o 'key'" },
        { status: 400 }
      );
    }

    // También eliminar permisos asociados
    await prisma.profileFeature.deleteMany({
      where: { featureKey: key || undefined },
    });

    await prisma.featureDefinition.delete({
      where: id ? { id } : { key },
    });

    console.log(`🗑️ Feature eliminada: ${key || id}`);
    return NextResponse.json({
      ok: true,
      message: "Feature eliminada correctamente",
    });
  } catch (error: any) {
    console.error("❌ Error DELETE definition:", error);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar definición" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ⚙️ Configuración del endpoint
========================================================= */
export const dynamic = "force-dynamic";
export const preferredRegion = "auto";
