/**
 * 🔗 API: SEI Links Management
 * GET /api/admin/sei-links - Listar todos los links SEI
 * POST /api/admin/sei-links - Crear nuevo link SEI
 * PATCH /api/admin/sei-links - Actualizar link SEI
 * DELETE /api/admin/sei-links - Eliminar link SEI
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

export const dynamic = "force-dynamic";

// =========================================================
// GET — Listar todos los Links SEI
// =========================================================
export async function GET(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const language = searchParams.get("language");
    const planSlug = searchParams.get("planSlug");
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const where: any = {};

    if (activeOnly) {
      where.isActive = true;
    }

    if (language) {
      where.language = language;
    }

    if (planSlug) {
      where.OR = [{ planSlug: planSlug }, { planSlug: null }];
    }

    const links = await prisma.seiLink.findMany({
      where,
      orderBy: [{ language: "asc" }, { isDefault: "desc" }, { name: "asc" }],
    });

    // Agrupar por idioma para facilitar uso en frontend
    const byLanguage: Record<string, typeof links> = {};
    for (const link of links) {
      if (!byLanguage[link.language]) {
        byLanguage[link.language] = [];
      }
      byLanguage[link.language].push(link);
    }

    return NextResponse.json({
      ok: true,
      total: links.length,
      links,
      byLanguage,
    });
  } catch (err: any) {
    console.error("❌ Error GET /api/admin/sei-links:", err);
    return NextResponse.json(
      { ok: false, error: "Error cargando links SEI" },
      { status: 500 }
    );
  }
}

// =========================================================
// POST — Crear un nuevo Link SEI
// =========================================================
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const body = await req.json();
    const {
      code,
      name,
      url,
      language,
      planSlug,
      isDefault,
      sixSecondsProjectId,
      isActive,
      description,
      notes,
    } = body;

    if (!code || !name || !url) {
      return NextResponse.json(
        { ok: false, error: "Los campos 'code', 'name' y 'url' son obligatorios" },
        { status: 400 }
      );
    }

    // Verificar code único
    const existingByCode = await prisma.seiLink.findUnique({ where: { code } });
    if (existingByCode) {
      return NextResponse.json(
        { ok: false, error: "Ya existe un link con ese código" },
        { status: 409 }
      );
    }

    // Si es default, quitar default a otros del mismo idioma
    if (isDefault) {
      await prisma.seiLink.updateMany({
        where: { language: language || "es", isDefault: true },
        data: { isDefault: false },
      });
    }

    const created = await prisma.seiLink.create({
      data: {
        code,
        name,
        url,
        language: language || "es",
        planSlug: planSlug || null,
        isDefault: isDefault ?? false,
        sixSecondsProjectId: sixSecondsProjectId || null,
        isActive: isActive ?? true,
        description: description || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Link SEI creado correctamente",
      link: created,
    });
  } catch (err: any) {
    console.error("❌ Error POST /api/admin/sei-links:", err);
    return NextResponse.json(
      { ok: false, error: "Error al crear el link SEI" },
      { status: 500 }
    );
  }
}

// =========================================================
// PATCH — Editar un Link SEI existente
// =========================================================
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Falta el ID del link" },
        { status: 400 }
      );
    }

    // Verificar que el link existe
    const existing = await prisma.seiLink.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Link no encontrado" },
        { status: 404 }
      );
    }

    // Verificar code único si se cambia
    if (data.code && data.code !== existing.code) {
      const existingByCode = await prisma.seiLink.findUnique({
        where: { code: data.code },
      });
      if (existingByCode) {
        return NextResponse.json(
          { ok: false, error: "Ya existe un link con ese código" },
          { status: 409 }
        );
      }
    }

    // Si se está activando isDefault, quitar default a otros del mismo idioma
    if (data.isDefault === true && !existing.isDefault) {
      const targetLanguage = data.language || existing.language;
      await prisma.seiLink.updateMany({
        where: {
          language: targetLanguage,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    // Construir objeto de actualización solo con campos proporcionados
    const updateData: Record<string, any> = {};

    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.planSlug !== undefined) updateData.planSlug = data.planSlug;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
    if (data.sixSecondsProjectId !== undefined)
      updateData.sixSecondsProjectId = data.sixSecondsProjectId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await prisma.seiLink.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ok: true,
      message: "Link SEI actualizado correctamente",
      link: updated,
    });
  } catch (err: any) {
    console.error("❌ Error PATCH /api/admin/sei-links:", err);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar el link SEI" },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE — Eliminar un Link SEI
// =========================================================
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Falta el ID del link" },
        { status: 400 }
      );
    }

    await prisma.seiLink.delete({ where: { id } });

    return NextResponse.json({
      ok: true,
      message: "Link SEI eliminado correctamente",
    });
  } catch (err: any) {
    console.error("❌ Error DELETE /api/admin/sei-links:", err);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar el link SEI" },
      { status: 500 }
    );
  }
}
