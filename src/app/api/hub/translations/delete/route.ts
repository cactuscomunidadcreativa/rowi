import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/**
 * 🗑️ DELETE /api/hub/translations/delete
 * --------------------------------------
 * Borra todas las traducciones del idioma o idiomas especificados.
 * Ejemplo:
 *   /api/hub/translations/delete?langs=pt,it
 */
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const langsParam = url.searchParams.get("langs") || "";
    const langs = langsParam
      .split(",")
      .map((l) => l.trim().toLowerCase())
      .filter(Boolean);

    if (!langs.length) {
      return NextResponse.json(
        { ok: false, error: "Debe especificar al menos un idioma (?langs=pt,it,en...)" },
        { status: 400 }
      );
    }

    // Contar antes de eliminar
    const counts = await Promise.all(
      langs.map(async (lang) => {
        const total = await prisma.translation.count({ where: { lang } });
        return { lang, total };
      })
    );

    // Borrar
    const deletions = await Promise.all(
      langs.map(async (lang) =>
        prisma.translation.deleteMany({ where: { lang } })
      )
    );

    const deletedTotal = deletions.reduce((acc, d) => acc + d.count, 0);

    return NextResponse.json({
      ok: true,
      message: `✅ Traducciones eliminadas para: ${langs.join(", ")}`,
      before: counts,
      deletedTotal,
    });
  } catch (e: any) {
    console.error("❌ Error DELETE /hub/translations/delete:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Error al eliminar traducciones" },
      { status: 500 }
    );
  }
}