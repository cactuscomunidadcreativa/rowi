import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/**
 * 💾 POST /api/hub/translations/save
 * ---------------------------------------------------------
 * Guarda las traducciones recibidas en la base de datos.
 *
 * ⚠️ IMPORTANTE: NO exporta automáticamente a JSON.
 * Los archivos JSON en /src/lib/i18n/locales/ son la fuente de verdad.
 * La BD es solo para traducciones personalizadas por tenant.
 *
 * Para actualizar traducciones globales, edita directamente los JSON.
 */
export async function POST(req: NextRequest) {
  try {
    const updates = await req.json();
    if (!Array.isArray(updates)) {
      return NextResponse.json({ ok: false, error: "Formato inválido" }, { status: 400 });
    }

    let updated = 0;
    let created = 0;

    for (const item of updates) {
      const { ns, key, lang, value, tenantId } = item;
      if (!ns || !key || !lang) continue;

      // Solo guardar en BD si tiene tenantId (personalización por tenant)
      // Las traducciones globales deben editarse en los JSON
      const existing = await prisma.translation.findFirst({
        where: { ns, key, lang, tenantId: tenantId || null }
      });

      if (existing) {
        await prisma.translation.update({
          where: { id: existing.id },
          data: { value },
        });
        updated++;
      } else {
        await prisma.translation.create({
          data: { ns, key, lang, value: value || "", tenantId: tenantId || null },
        });
        created++;
      }
    }

    // ⚠️ Ya NO exportamos a JSON automáticamente para evitar ciclos
    // Los JSON son la fuente de verdad y deben editarse manualmente

    return NextResponse.json({
      ok: true,
      message: "✅ Traducciones guardadas en BD",
      updated,
      created,
      total: updated + created,
    });
  } catch (e: any) {
    console.error("❌ Error POST /hub/translations/save:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}