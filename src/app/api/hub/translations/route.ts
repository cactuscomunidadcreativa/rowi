import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Imports estáticos: la fuente confiable en serverless (Vercel bundlea estos JSON).
// fs.readdirSync sobre process.cwd() es frágil en producción y puede no ver los archivos.
import es from "@/lib/i18n/locales/es.json";
import en from "@/lib/i18n/locales/en.json";
import pt from "@/lib/i18n/locales/pt.json";
import it from "@/lib/i18n/locales/it.json";
import zh from "@/lib/i18n/locales/zh.json";

export const runtime = "nodejs";

const STATIC_LOCALES: Record<string, Record<string, string>> = {
  es: es as Record<string, string>,
  en: en as Record<string, string>,
  pt: pt as Record<string, string>,
  it: it as Record<string, string>,
  zh: zh as Record<string, string>,
};

/**
 * 📘 GET /api/hub/translations
 * ---------------------------------------------------------
 * 🔹 Devuelve traducciones de los archivos JSON (fuente de verdad)
 * 🔹 Formato: { es: {...}, en: {...}, ..., zh: {...} }
 * 🔹 Usa imports estáticos (confiable en serverless); fs solo como complemento
 *    para detectar locales extra que no estén en la lista estática.
 */
export async function GET(req: NextRequest) {
  try {
    // Base confiable: los locales bundleados estáticamente.
    const result: Record<string, Record<string, string>> = { ...STATIC_LOCALES };

    // Complemento opcional: si el filesystem está accesible, recoger cualquier
    // locale adicional que no esté ya en la lista estática (no pisa los estáticos).
    try {
      const LOCALES_DIR = path.resolve(process.cwd(), "src/lib/i18n/locales");
      if (fs.existsSync(LOCALES_DIR)) {
        for (const file of fs.readdirSync(LOCALES_DIR)) {
          if (!file.endsWith(".json")) continue;
          const lang = file.replace(".json", "");
          if (result[lang]) continue; // ya cubierto por el import estático
          try {
            result[lang] = JSON.parse(
              fs.readFileSync(path.join(LOCALES_DIR, file), "utf8"),
            );
          } catch {
            result[lang] = {};
          }
        }
      }
    } catch {
      // En serverless el fs puede no estar disponible — los estáticos bastan.
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
