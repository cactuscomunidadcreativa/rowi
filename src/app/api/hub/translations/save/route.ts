import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

/**
 * 💾 POST /api/hub/translations/save
 * ---------------------------------------------------------
 * Guarda las traducciones en los archivos JSON.
 *
 * Formato esperado: { es: {...}, en: {...} }
 *
 * ⚠️ Los archivos JSON son la fuente de verdad.
 * Este endpoint modifica directamente los archivos JSON.
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Validar formato
    if (!data || typeof data !== "object") {
      return NextResponse.json({ ok: false, error: "Formato inválido" }, { status: 400 });
    }

    const LOCALES_DIR = path.resolve(process.cwd(), "src/lib/i18n/locales");

    // Asegurar que el directorio existe
    if (!fs.existsSync(LOCALES_DIR)) {
      fs.mkdirSync(LOCALES_DIR, { recursive: true });
    }

    let savedLangs = 0;
    let totalKeys = 0;

    // Guardar todos los idiomas que vengan en el objeto
    for (const lang of Object.keys(data)) {
      if (data[lang] && typeof data[lang] === "object" && /^[a-z]{2}$/.test(lang)) {
        const filePath = path.join(LOCALES_DIR, `${lang}.json`);

        // Ordenar las claves alfabéticamente para mantener consistencia
        const sortedKeys = Object.keys(data[lang]).sort();
        const sortedData: Record<string, string> = {};
        for (const key of sortedKeys) {
          sortedData[key] = data[lang][key];
        }

        // Escribir el archivo JSON con formato legible
        fs.writeFileSync(filePath, JSON.stringify(sortedData, null, 2) + "\n", "utf8");

        savedLangs++;
        totalKeys += sortedKeys.length;
        console.log(`💾 Saved ${lang}.json with ${sortedKeys.length} keys`);
      }
    }

    return NextResponse.json({
      ok: true,
      message: `✅ Traducciones guardadas`,
      savedLangs,
      totalKeys,
    });
  } catch (e: any) {
    console.error("❌ Error POST /hub/translations/save:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
