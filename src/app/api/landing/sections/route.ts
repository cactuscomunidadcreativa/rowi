import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

/**
 * 🌐 GET /api/landing/sections
 * ---------------------------------------------------------
 * Obtiene las secciones visibles de la landing page.
 * Este endpoint es público (no requiere autenticación).
 */
export async function GET() {
  try {
    const sections = await prisma.landingSection.findMany({
      where: { isVisible: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        type: true,
        order: true,
        config: true,
        content: true,
      },
    });

    return NextResponse.json({
      ok: true,
      sections,
    });
  } catch (e: any) {
    console.error("❌ GET /api/landing/sections:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
