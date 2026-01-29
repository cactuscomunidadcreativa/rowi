import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

/**
 * 📘 GET /api/hub/translations
 * ---------------------------------------------------------
 * 🔹 Devuelve traducciones de los archivos JSON (fuente de verdad)
 * 🔹 Formato: { es: {...}, en: {...} }
 * 🔹 Los archivos JSON en /src/lib/i18n/locales/ son la fuente de verdad
 */
export async function GET(req: NextRequest) {
  try {
    const LOCALES_DIR = path.resolve(process.cwd(), "src/lib/i18n/locales");

    const result: Record<string, Record<string, string>> = {};

    // Leer todos los archivos .json del directorio de locales
    if (fs.existsSync(LOCALES_DIR)) {
      const files = fs.readdirSync(LOCALES_DIR);

      for (const file of files) {
        if (file.endsWith(".json")) {
          const lang = file.replace(".json", "");
          const filePath = path.join(LOCALES_DIR, file);

          try {
            const content = fs.readFileSync(filePath, "utf8");
            result[lang] = JSON.parse(content);
          } catch (e) {
            console.error(`Error reading ${filePath}:`, e);
            result[lang] = {};
          }
        }
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("❌ Error GET /hub/translations:", err);
    return NextResponse.json(
      { ok: false, error: "Error al leer archivos de traducción" },
      { status: 500 },
    );
  }
}
