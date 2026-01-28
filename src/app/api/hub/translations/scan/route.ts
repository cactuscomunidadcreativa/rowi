import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

/**
 * 🌎 ROWI SMARTSCAN v9.3 — Spanish & UI Deep Scanner
 * ---------------------------------------------------------
 * ✅ Limpia la base de datos y los archivos locales
 * ✅ Escanea TODO el código (src, app, components, layers, pages)
 * ✅ Detecta textos en español (2–200 caracteres, incluyendo emojis)
 * ✅ Detecta:
 *    - t("ns.key")
 *    - Textos visibles (HTML / JSX)
 *    - Textos multilínea
 *    - Props comunes: label, title, placeholder, alt, tooltip, helperText, aria-label, text, children, value
 * ✅ Inserta nuevas claves (ES base)
 * ✅ Exporta JSON locales actualizados
 * ✅ Genera logs detallados
 */

export async function GET() {
  try {
    const LOCALES_DIR = path.resolve(process.cwd(), "src/lib/i18n/locales");
    const LOGS_DIR = path.resolve(process.cwd(), "src/logs");
    const ROOTS = [
      path.resolve(process.cwd(), "src"),
      path.resolve(process.cwd(), "app"),
      path.resolve(process.cwd(), "components"),
      path.resolve(process.cwd(), "layers"),
      path.resolve(process.cwd(), "pages"),
    ];
    const LANGS = ["es", "en", "pt", "it"];
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
    ];

    // =========================================================
    // 🔧 Helpers
    // =========================================================
    const ensureDir = (dir: string) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    };

    // ✅ Mantiene acentos, emojis, y caracteres españoles válidos
    const sanitize = (str?: string) =>
      String(str || "")
        .replace(/\r?\n|\r/g, " ")
        .replace(/\s{2,}/g, " ")
        .replace(/[^\p{L}\p{N}\p{P}\p{Z}\p{Emoji_Presentation}\p{Extended_Pictographic}áéíóúÁÉÍÓÚñÑ¿¡]/gu, "")
        .replace(/[\uD800-\uDFFF]/g, "")
        .trim();

    function* walk(dir: string): Generator<string> {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && !IGNORED.includes(entry.name)) yield* walk(full);
        else if (/\.(ts|tsx|js|jsx|html)$/.test(entry.name)) yield full;
      }
    }

    // =========================================================
    // 🧹 Limpieza total
    // =========================================================
    console.log("🧹 Limpiando base de datos y locales...");
    await prisma.translation.deleteMany();
    ensureDir(LOCALES_DIR);
    ensureDir(LOGS_DIR);
    fs.writeFileSync(path.join(LOGS_DIR, "scan-report.log"), "", "utf8");

    for (const file of fs.readdirSync(LOCALES_DIR)) {
      if (file.endsWith(".json")) fs.unlinkSync(path.join(LOCALES_DIR, file));
    }

    console.log("✅ Limpieza completada.");

    // =========================================================
    // 🧩 Regex mejorados
    // =========================================================
    const RE = {
      FUNC: /\b(?:\w+\.)?(?:t|translate)\s*\(\s*["'`]([^"'`]+?)["'`]/g,
      JSX: />\s*([^<>{}]{2,200}?)\s*<\/[A-Za-z0-9_-]+>/gs,
      PROP: /\b(?:label|title|placeholder|aria-label|alt|tooltip|helperText|text|children|value)\s*=\s*["'`]([^"'`]{2,200})["'`]/g,
    };

    // =========================================================
    // 🔍 Analizar archivo
    // =========================================================
    function analyzeFile(file: string) {
      const src = fs.readFileSync(file, "utf8");
      const results: { key: string; text?: string }[] = [];

      const relPath = file.split("src/")[1] || file;
      let ns = relPath
        .replace(/\/(page|layout|index)\.[tj]sx?$/, "")
        .replace(/\//g, ".")
        .replace(/\.(ts|tsx|js|jsx|html)$/, "")
        .toLowerCase()
        .trim();
      ns = ns || "ui";
      const base = path.basename(file).replace(/\.[tj]sx?$/, "");

      const addResult = (key: string, text?: string) => {
        key = sanitize(key);
        if (key && key.length < 200) results.push({ key, text });
      };

      for (const m of src.matchAll(RE.FUNC)) addResult(m[1]);

      for (const m of src.matchAll(RE.JSX)) {
        const txt = sanitize(m[1]);
        if (
          txt &&
          txt.length >= 2 &&
          txt.length <= 200 &&
          /[a-zA-ZáéíóúÁÉÍÓÚñÑ¿¡]/.test(txt)
        ) {
          const key = `${ns}.${base}_${txt
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_áéíóúñ]/gi, "")}`;
          addResult(key, txt);
        }
      }

      for (const m of src.matchAll(RE.PROP)) {
        const txt = sanitize(m[1]);
        if (
          txt &&
          txt.length >= 2 &&
          txt.length <= 200 &&
          /[a-zA-ZáéíóúÁÉÍÓÚñÑ¿¡]/.test(txt)
        ) {
          const key = `${ns}.${base}_${txt
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_áéíóúñ]/gi, "")}`;
          addResult(key, txt);
        }
      }

      return results;
    }

    // =========================================================
    // 🔁 Escaneo completo
    // =========================================================
    const found: Map<string, string> = new Map();
    const logPath = path.join(LOGS_DIR, "scan-report.log");
    const log = (msg: string) => fs.appendFileSync(logPath, msg + "\n");

    for (const root of ROOTS) {
      if (!fs.existsSync(root)) continue;
      for (const file of walk(root)) {
        const results = analyzeFile(file);
        if (results.length) log(`📄 ${file}: ${results.length} claves`);
        for (const { key, text } of results) if (!found.has(key)) found.set(key, text || "");
      }
    }

    log(`\nTOTAL DETECTADAS: ${found.size}`);
    console.log(`🔍 Detectadas ${found.size} claves.`);

    // =========================================================
    // 💾 Guardar en base de datos
    // =========================================================
    let added = 0;
    for (const [keyFull, textRaw] of found.entries()) {
      const [ns, ...rest] = keyFull.split(".");
      const key = rest.join(".");
      if (!ns || !key) continue;
      const text = sanitize(textRaw || key);

      for (const lang of LANGS) {
        try {
          await prisma.translation.create({
            data: { ns, key, lang, value: lang === "es" ? text || key : "" },
          });
          added++;
        } catch (err: any) {
          log(`❌ Error en ${ns}.${key} (${lang}): ${err.message}`);
        }
      }
    }

    const total = await prisma.translation.count();

    // =========================================================
    // 🗂️ Exportar locales JSON
    // =========================================================
    const all = await prisma.translation.findMany({
      orderBy: [{ ns: "asc" }, { key: "asc" }, { lang: "asc" }],
    });

    const perLang: Record<string, Record<string, string>> = { es: {}, en: {}, pt: {}, it: {} };
    for (const t of all) {
      const full = `${t.ns}.${t.key}`;
      perLang[t.lang as keyof typeof perLang][full] = t.value || "";
    }

    for (const lang of LANGS) {
      const filePath = path.join(LOCALES_DIR, `${lang}.json`);
      fs.writeFileSync(filePath, JSON.stringify(perLang[lang], null, 2), "utf8");
      log(`✅ Locales exportados: ${filePath} (${Object.keys(perLang[lang]).length})`);
    }

    // =========================================================
    // 🧾 Reporte final
    // =========================================================
    const summary = `
-----------------------------------------------
📊 ESCANEO COMPLETADO (Modo Español + Emojis)
-----------------------------------------------
🧩 Claves detectadas: ${found.size}
💾 Insertadas: ${added}
📚 Total BD: ${total}
🗂️ Locales: ${LOCALES_DIR}
📘 Log: ${logPath}
-----------------------------------------------`;

    console.log(summary);
    log(summary);

    return NextResponse.json({
      ok: true,
      message: "✅ Escaneo completo: Código + Locales + BD (modo español)",
      added,
      total,
      localesDir: LOCALES_DIR,
      logPath,
    });
  } catch (e: any) {
    console.error("❌ Error /api/hub/translations/scan:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}