import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

/**
 * 🎨 POST /api/admin/landing-builder/reorder
 * ---------------------------------------------------------
 * Reordena las secciones de la landing page.
 * Recibe un array de IDs en el nuevo orden.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { orderedIds } = await req.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { ok: false, error: "orderedIds must be an array" },
        { status: 400 }
      );
    }

    // Actualizar el orden de cada sección
    const updates = orderedIds.map((id: string, index: number) =>
      prisma.landingSection.update({
        where: { id },
        data: { order: index },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ ok: true, reordered: orderedIds.length });
  } catch (e: any) {
    console.error("❌ POST /api/admin/landing-builder/reorder:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
