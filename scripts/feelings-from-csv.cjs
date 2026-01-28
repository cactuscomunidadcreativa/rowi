const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");

const INPUT = path.join(process.cwd(), "data", "raw", "lexico", "VOCABULARIO_EMOCIONES.csv");
const OUT_DIR = path.join(process.cwd(), "src", "data", "feelings");
fs.mkdirSync(OUT_DIR, { recursive: true });

function normKey(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function splitMulti(v) {
  return String(v || "")
    .split(/[;,/|]/)
    .map((x) => x.trim())
    .filter(Boolean);
}
function sortByNorm(a, b) {
  const na = a.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const nb = b.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return na.localeCompare(nb);
}

const buckets = { es: new Set(), en: new Set(), pt: new Set(), it: new Set() };

if (!fs.existsSync(INPUT)) {
  console.error("No existe CSV:", INPUT);
  process.exit(1);
}

const csv = fs.readFileSync(INPUT, "utf8");
const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
if (parsed.errors && parsed.errors.length) {
  console.warn("Avisos CSV:", parsed.errors.slice(0, 3));
}
const rows = parsed.data || [];
const headers = Object.keys(rows[0] || {});

const cols = {
  es: headers.filter((h) => /(es|span|espanol|español|emoc|palabra)/i.test(normKey(h))),
  en: headers.filter((h) => /(en|eng|english|feel|word)/i.test(normKey(h))),
  pt: headers.filter((h) => /(ptbr|pt-br|\bbr\b|\bpt\b|portugu|portugues|português)/i.test(normKey(h))),
  it: headers.filter((h) => /(it|ital|italiano)/i.test(normKey(h))),
};

for (const r of rows) {
  for (const h of cols.es) splitMulti(r[h]).forEach((w) => w && buckets.es.add(w));
  for (const h of cols.en) splitMulti(r[h]).forEach((w) => w && buckets.en.add(w));
  for (const h of cols.pt) splitMulti(r[h]).forEach((w) => w && buckets.pt.add(w)); // BR → PT
  for (const h of cols.it) splitMulti(r[h]).forEach((w) => w && buckets.it.add(w));
}

for (const lang of Object.keys(buckets)) {
  const words = Array.from(buckets[lang]).map(w => w.replace(/\s+/g," ").trim()).filter(Boolean).sort(sortByNorm);
  fs.writeFileSync(path.join(OUT_DIR, `${lang}.json`), JSON.stringify({ words }, null, 2), "utf8");
  console.log(`✓ feelings ${lang}: ${words.length}`);
}
