/** H2.C — claves i18n del buscador ⌘K del admin (5 idiomas). Idempotente. */
import * as fs from "fs";
import * as path from "path";

type Five = { es: string; en: string; pt: string; it: string; zh: string };

const KEYS: Record<string, Five> = {
  "adminSearch.open": { es: "Abrir buscador", en: "Open search", pt: "Abrir busca", it: "Apri ricerca", zh: "打开搜索" },
  "adminSearch.placeholder": { es: "Buscar…", en: "Search…", pt: "Buscar…", it: "Cerca…", zh: "搜索…" },
  "adminSearch.inputPlaceholder": {
    es: "Busca una sección, página o ajuste…",
    en: "Search a section, page or setting…",
    pt: "Busque uma seção, página ou ajuste…",
    it: "Cerca una sezione, pagina o impostazione…",
    zh: "搜索板块、页面或设置…",
  },
  "adminSearch.empty": {
    es: "Sin resultados. Prueba “roles”, “cupones” o “benchmark”.",
    en: "No results. Try “roles”, “coupons” or “benchmark”.",
    pt: "Sem resultados. Tente “papéis”, “cupons” ou “benchmark”.",
    it: "Nessun risultato. Prova “ruoli”, “coupon” o “benchmark”.",
    zh: "无结果。试试“角色”“优惠券”或“benchmark”。",
  },
};

const LOCALES: Array<keyof Five> = ["es", "en", "pt", "it", "zh"];
const dir = path.join(process.cwd(), "src/lib/i18n/locales");
let n = 0;
for (const loc of LOCALES) {
  const file = path.join(dir, `${loc}.json`);
  const json = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, string>;
  for (const [key, val] of Object.entries(KEYS)) {
    if (json[key] !== val[loc]) { json[key] = val[loc]; n++; }
  }
  const sorted: Record<string, string> = {};
  for (const k of Object.keys(json).sort()) sorted[k] = json[k];
  fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + "\n", "utf8");
}
console.log(`[h2c-search-i18n] ${n} escrituras`);
