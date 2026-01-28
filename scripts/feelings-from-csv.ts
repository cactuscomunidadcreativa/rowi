import * as fs from "fs";
import * as path from "path";
import * as Papa from "papaparse";

const INPUT = path.join(process.cwd(), "data", "raw", "lexico", "VOCABULARIO_EMOCIONES.csv");
const OUT_DIR = path.join(process.cwd(), "src", "data", "feelings");
fs.mkdirSync(OUT_DIR, { recursive: true });

type Lang = "es" | "en" | "pt" | "it";
const buckets: Record<Lang, Set<string>> = { es: new Set(), en: new Set(), pt: new Set(), it: new Set() };

const csv = fs.readFileSync(INPUT, "utf8");
const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
const rows = parsed.data || [];
const headers = Object.keys(rows[0] || {});

function normKey(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function splitMulti(v: string) {
  return String(v || "")
    .split(/[;,/|]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

// Detectar columnas según idioma
const cols = {
  es: headers.filter((h) => /es|span/i.test(normKey(h))),
  en: headers.filter((h) => /en|eng|word|feel/i.test(normKey(h))),
  pt: headers.filter((h) => /pt|portugu/i.test(normKey(h))), // incluye BR → PT
  it: headers.filter((h) => /it|ital/i.test(normKey(h))),
};

for (const r of rows) {
  (["es", "en", "pt", "it"] as Lang[]).forEach((lang) => {
    for (const h of cols[lang]) {
      splitMulti(r[h]).forEach((w) => buckets[lang].add(w));
    }
  });
}

for (const lang of Object.keys(buckets) as Lang[]) {
  const words = Array.from(buckets[lang]).sort();
  fs.writeFileSync(path.join(OUT_DIR, `${lang}.json`), JSON.stringify({ words }, null, 2));
  console.log(`✓ feelings ${lang}: ${words.length}`);
}