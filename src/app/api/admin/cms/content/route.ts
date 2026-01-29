/**
 * 📝 API: CMS Content Management
 * GET /api/admin/cms/content - Listar contenido CMS
 * POST /api/admin/cms/content - Crear contenido
 * PATCH /api/admin/cms/content - Actualizar contenido
 * DELETE /api/admin/cms/content - Eliminar contenido
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const dynamic = "force-dynamic";

// =========================================================
// GET — Listar contenido CMS
// =========================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const language = searchParams.get("language");
    const key = searchParams.get("key");

    const where: any = {};

    if (category) where.category = category;
    if (language) where.language = language;
    if (key) where.key = key;

    const content = await prisma.cmsContent.findMany({
      where,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    // Agrupar por categoría para facilitar uso
    const byCategory: Record<string, typeof content> = {};
    for (const item of content) {
      const cat = item.category || "general";
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(item);
    }

    return NextResponse.json({
      ok: true,
      total: content.length,
      content,
      byCategory,
    });
  } catch (err: any) {
    console.error("❌ Error GET /api/admin/cms/content:", err);
    return NextResponse.json(
      { ok: false, error: "Error loading CMS content" },
      { status: 500 }
    );
  }
}

// =========================================================
// POST — Crear contenido CMS
// =========================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      key,
      language,
      value,
      valueType,
      category,
      subcategory,
      description,
      placeholder,
      isActive,
    } = body;

    if (!key || !value) {
      return NextResponse.json(
        { ok: false, error: "Key and value are required" },
        { status: 400 }
      );
    }

    // Verificar que no exista
    const existing = await prisma.cmsContent.findUnique({
      where: {
        key_language: {
          key,
          language: language || "es",
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Content with this key and language already exists" },
        { status: 409 }
      );
    }

    const created = await prisma.cmsContent.create({
      data: {
        key,
        language: language || "es",
        value,
        valueType: valueType || "TEXT",
        category: category || null,
        subcategory: subcategory || null,
        description: description || null,
        placeholder: placeholder || null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Content created successfully",
      content: created,
    });
  } catch (err: any) {
    console.error("❌ Error POST /api/admin/cms/content:", err);
    return NextResponse.json(
      { ok: false, error: "Error creating content" },
      { status: 500 }
    );
  }
}

// =========================================================
// PATCH — Actualizar contenido CMS
// =========================================================
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "ID is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.cmsContent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Si cambia key o language, verificar unicidad
    if (
      (data.key && data.key !== existing.key) ||
      (data.language && data.language !== existing.language)
    ) {
      const newKey = data.key || existing.key;
      const newLang = data.language || existing.language;
      const duplicate = await prisma.cmsContent.findUnique({
        where: {
          key_language: { key: newKey, language: newLang },
        },
      });
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json(
          { ok: false, error: "Content with this key and language already exists" },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, any> = {};
    if (data.key !== undefined) updateData.key = data.key;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.valueType !== undefined) updateData.valueType = data.valueType;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.subcategory !== undefined) updateData.subcategory = data.subcategory;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.placeholder !== undefined) updateData.placeholder = data.placeholder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prisma.cmsContent.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ok: true,
      message: "Content updated successfully",
      content: updated,
    });
  } catch (err: any) {
    console.error("❌ Error PATCH /api/admin/cms/content:", err);
    return NextResponse.json(
      { ok: false, error: "Error updating content" },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE — Eliminar contenido CMS
// =========================================================
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "ID is required" },
        { status: 400 }
      );
    }

    await prisma.cmsContent.delete({ where: { id } });

    return NextResponse.json({
      ok: true,
      message: "Content deleted successfully",
    });
  } catch (err: any) {
    console.error("❌ Error DELETE /api/admin/cms/content:", err);
    return NextResponse.json(
      { ok: false, error: "Error deleting content" },
      { status: 500 }
    );
  }
}
