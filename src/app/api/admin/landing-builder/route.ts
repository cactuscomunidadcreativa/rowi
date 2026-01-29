import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

/**
 * 🎨 GET /api/admin/landing-builder
 * ---------------------------------------------------------
 * Obtiene todas las secciones de la landing page ordenadas.
 */
export async function GET() {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const sections = await prisma.landingSection.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      ok: true,
      sections,
      total: sections.length,
    });
  } catch (e: any) {
    console.error("❌ GET /api/admin/landing-builder:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

/**
 * 🎨 POST /api/admin/landing-builder
 * ---------------------------------------------------------
 * Crea una nueva sección de landing page.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { type, order, isVisible, config, content, name, description } = data;

    if (!type || content === undefined) {
      return NextResponse.json(
        { ok: false, error: "type and content are required" },
        { status: 400 }
      );
    }

    // Obtener el orden máximo actual si no se especifica
    let finalOrder = order;
    if (finalOrder === undefined || finalOrder === null) {
      const maxOrder = await prisma.landingSection.aggregate({
        _max: { order: true },
      });
      finalOrder = (maxOrder._max.order ?? -1) + 1;
    }

    const section = await prisma.landingSection.create({
      data: {
        type,
        order: finalOrder,
        isVisible: isVisible ?? true,
        config: config || {},
        content,
        name: name || null,
        description: description || null,
      },
    });

    return NextResponse.json({ ok: true, section });
  } catch (e: any) {
    console.error("❌ POST /api/admin/landing-builder:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

/**
 * 🎨 PATCH /api/admin/landing-builder
 * ---------------------------------------------------------
 * Actualiza una sección existente.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { id, ...updates } = data;

    if (!id) {
      return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
    }

    const section = await prisma.landingSection.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ ok: true, section });
  } catch (e: any) {
    console.error("❌ PATCH /api/admin/landing-builder:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

/**
 * 🎨 DELETE /api/admin/landing-builder
 * ---------------------------------------------------------
 * Elimina una sección.
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
    }

    await prisma.landingSection.delete({ where: { id } });

    return NextResponse.json({ ok: true, deleted: id });
  } catch (e: any) {
    console.error("❌ DELETE /api/admin/landing-builder:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
