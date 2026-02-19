// src/app/api/hub/pages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAuth, requireSuperAdmin } from "@/core/auth/requireAdmin";

export const runtime = "nodejs";

/* =========================================================
   📄 GET — listar páginas por tenant (default: six-seconds-global)
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId") || "six-seconds-global";

    const pages = await prisma.page.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(pages);
  } catch (err: any) {
    console.error("❌ Error GET /pages:", err);
    return NextResponse.json({ error: "Error listando páginas" }, { status: 500 });
  }
}

/* =========================================================
   ➕ POST — crear una nueva página
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const body = await req.json();
    const {
      tenantId = "six-seconds-global",
      slug,
      title,
      layout = "default",
      blocks = {},
      meta = {},
    } = body;

    if (!slug || !title) {
      return NextResponse.json(
        { error: "slug y title son requeridos" },
        { status: 400 }
      );
    }

    const page = await prisma.page.create({
      data: {
        tenantId,
        slug,
        title,
        meta,
        blocks,
        status: "draft",
        type: "page",
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (err: any) {
    console.error("❌ Error POST /pages:", err);
    return NextResponse.json({ error: "Error creando página" }, { status: 500 });
  }
}

/* =========================================================
   🛠 PATCH — actualizar una página
========================================================= */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { id, title, slug, status, blocks, meta } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id requerido para actualizar página" },
        { status: 400 }
      );
    }

    const page = await prisma.page.update({
      where: { id },
      data: { title, slug, status, blocks, meta },
    });

    return NextResponse.json(page);
  } catch (err: any) {
    console.error("❌ Error PATCH /pages:", err);
    return NextResponse.json({ error: "Error actualizando página" }, { status: 500 });
  }
}

/* =========================================================
   ❌ DELETE — eliminar una página
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "id requerido para eliminar página" },
        { status: 400 }
      );
    }

    await prisma.page.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: "Página eliminada correctamente" });
  } catch (err: any) {
    console.error("❌ Error DELETE /pages:", err);
    return NextResponse.json({ error: "Error eliminando página" }, { status: 500 });
  }
}