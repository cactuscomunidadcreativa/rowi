import fs from "fs";
import path from "path";

export type Dict = Record<string, string>;

/**
 * 🧠 getI18n — Carga y resuelve traducciones en servidor
 * 🔹 Compatible con Server Components y API Routes
 * 🔹 Soporta fallback entre idiomas (es → en → pt → it)
 */
export async function getI18n(lang: string = "es") {
  const langs = ["es", "en", "pt", "it", "zh"];
  const dicts: Record<string, Dict> = {};

  // 📁 Ruta base de los JSON locales
  const basePath = path.resolve(process.cwd(), "src/lib/i18n/locales");

  for (const l of langs) {
    const filePath = path.join(basePath, `${l}.json`);
    try {
      const content = fs.readFileSync(filePath, "utf8");
      dicts[l] = JSON.parse(content);
    } catch {
      dicts[l] = {};
    }
  }

  /**
   * 🔠 Traducción con fallback
   */
  function t(key: string, fallback?: string): string {
    if (!key) return "";
    const order = [lang, "es", "en", "pt", "it"];
    for (const l of order) {
      if (dicts[l]?.[key]) return dicts[l][key];
    }
    return fallback || humanizeKey(key);
  }

  return { t, lang };
}

/** 🧩 Convierte "nav.dashboard" → "Dashboard" */
function humanizeKey(key: string) {
  return key
    .split(".")
    .pop()!
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}