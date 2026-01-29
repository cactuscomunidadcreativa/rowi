import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

/**
 * 🌎 ROWI SAFE SCAN v10.0 — Non-destructive Translation Key Scanner
 * ---------------------------------------------------------
 * ✅ SOLO LECTURA - NO modifica archivos JSON existentes
 * ✅ SOLO LECTURA - NO borra datos de la base de datos
 * ✅ Escanea el código buscando claves t("key")
 * ✅ Compara con las traducciones existentes
 * ✅ Devuelve un reporte de claves faltantes
 */

export async function GET() {
  try {
    const LOCALES_DIR = path.resolve(process.cwd(), "src/lib/i18n/locales");
    const ROOTS = [
      path.resolve(process.cwd(), "src"),
    ];
    const LANGS = ["es", "en"];
    const IGNORED = [
      "node_modules",
      ".next",
      "dist",
      "build",
      "coverage",
      "public",
      "__tests__",
      "__mocks__",
      "test",
      "temp",
      "logs",
    ];

    // =========================================================
    // 🔧 Helpers
    // =========================================================
    function* walk(dir: string): Generator<string> {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && !IGNORED.includes(entry.name)) yield* walk(full);
        else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) yield full;
      }
    }

    // =========================================================
    // 📖 Cargar traducciones existentes (NO modificar)
    // =========================================================
    const existingKeys: Record<string, Set<string>> = {};

    for (const lang of LANGS) {
      existingKeys[lang] = new Set();
      const filePath = path.join(LOCALES_DIR, `${lang}.json`);
      if (fs.existsSync(filePath)) {
        try {
          const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
          Object.keys(content).forEach(key => existingKeys[lang].add(key));
        } catch (e) {
          console.error(`Error reading ${filePath}:`, e);
        }
      }
    }

    // =========================================================
    // 🔍 Regex para encontrar claves de traducción
    // =========================================================
    const RE_TRANSLATION_KEYS = /\bt\s*\(\s*["'`]([^"'`]+?)["'`]/g;

    // =========================================================
    // 🔁 Escaneo de código (SOLO LECTURA)
    // =========================================================
    const foundKeys = new Set<string>();
    const keyUsage: Record<string, string[]> = {};

    for (const root of ROOTS) {
      if (!fs.existsSync(root)) continue;
      for (const file of walk(root)) {
        try {
          const src = fs.readFileSync(file, "utf8");
          const relPath = file.replace(process.cwd(), "");

          for (const match of src.matchAll(RE_TRANSLATION_KEYS)) {
            const key = match[1];
            if (key && key.length > 0 && key.length < 200) {
              foundKeys.add(key);
              if (!keyUsage[key]) keyUsage[key] = [];
              if (!keyUsage[key].includes(relPath)) {
                keyUsage[key].push(relPath);
              }
            }
          }
        } catch (e) {
          // Skip files that can't be read
        }
      }
    }

    // =========================================================
    // 📊 Análisis de claves
    // =========================================================
    const missingInEs: string[] = [];
    const missingInEn: string[] = [];
    const unusedInEs: string[] = [];
    const unusedInEn: string[] = [];

    // Claves usadas en código pero no en traducciones
    for (const key of foundKeys) {
      if (!existingKeys.es.has(key)) missingInEs.push(key);
      if (!existingKeys.en.has(key)) missingInEn.push(key);
    }

    // Claves en traducciones pero no usadas en código
    for (const key of existingKeys.es) {
      if (!foundKeys.has(key)) unusedInEs.push(key);
    }
    for (const key of existingKeys.en) {
      if (!foundKeys.has(key)) unusedInEn.push(key);
    }

    // =========================================================
    // 📋 Reporte (sin modificar nada)
    // =========================================================
    const report = {
      ok: true,
      summary: {
        keysFoundInCode: foundKeys.size,
        keysInEs: existingKeys.es.size,
        keysInEn: existingKeys.en.size,
        missingInEs: missingInEs.length,
        missingInEn: missingInEn.length,
        unusedInEs: unusedInEs.length,
        unusedInEn: unusedInEn.length,
      },
      missingKeys: {
        es: missingInEs.slice(0, 50).map(key => ({
          key,
          usedIn: keyUsage[key]?.slice(0, 3) || [],
        })),
        en: missingInEn.slice(0, 50).map(key => ({
          key,
          usedIn: keyUsage[key]?.slice(0, 3) || [],
        })),
      },
      unusedKeys: {
        es: unusedInEs.slice(0, 50),
        en: unusedInEn.slice(0, 50),
      },
      message: `Scan completado. ${foundKeys.size} claves encontradas en código. ES: ${missingInEs.length} faltantes, EN: ${missingInEn.length} faltantes. Este scan es de SOLO LECTURA - no se modificaron archivos.`,
    };

    return NextResponse.json(report);
  } catch (e: any) {
    console.error("❌ Error /api/hub/translations/scan:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
