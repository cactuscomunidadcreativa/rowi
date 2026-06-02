/**
 * Valida la lógica del motor de análisis cruzado contra los CSV reales de
 * Bancolombia, SIN tocar la base de datos. Reproduce las correlaciones que
 * aparecen en los "Hallazgos" hechos a mano para confirmar que el motor
 * calcula lo mismo.
 *
 * Uso: node scripts/validate-cross-analysis.mjs "<ruta al quests csv>"
 */
import fs from "fs";

const path = process.argv[2] || "/Users/eduardogonzalez/Downloads/quests (2).csv";

// --- mini parser CSV (maneja comillas y decimales con coma) ---
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const parseLine = (line) => {
    const out = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQ = !inQ;
      else if (c === "," && !inQ) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out;
  };
  const headers = parseLine(lines[0]);
  return lines.slice(1).map((l) => {
    const cells = parseLine(l);
    const row = {};
    headers.forEach((h, i) => (row[h] = cells[i]));
    return row;
  });
}

// Convierte "108,937526" o "104.9" a número.
function num(v) {
  if (v == null || v === "") return null;
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
}

function mean(arr) {
  const v = arr.filter((x) => typeof x === "number" && !isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function pearson(x, y) {
  const pairs = [];
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    if (typeof x[i] === "number" && typeof y[i] === "number" && !isNaN(x[i]) && !isNaN(y[i])) {
      pairs.push([x[i], y[i]]);
    }
  }
  const n = pairs.length;
  if (n < 3) return { r: null, n };
  const mx = mean(pairs.map((p) => p[0]));
  const my = mean(pairs.map((p) => p[1]));
  let num = 0, dx = 0, dy = 0;
  for (const [a, b] of pairs) {
    num += (a - mx) * (b - my);
    dx += (a - mx) ** 2;
    dy += (b - my) ** 2;
  }
  const den = Math.sqrt(dx * dy);
  return { r: den === 0 ? 0 : num / den, n };
}

const rows = parseCSV(fs.readFileSync(path, "utf8"));
console.log(`\nFilas: ${rows.length}`);
console.log(`Proyecto(s): ${[...new Set(rows.map((r) => r.Project))].join(", ")}`);

// Columnas clave (Six Seconds)
const NE = rows.map((r) => num(r["Navigate Emotions Score"]));
const balance = rows.map((r) => num(r["Balance"]));
const qol = rows.map((r) => num(r["Quality of Life"]));
const eq = rows.map((r) => num(r["Emotional Intelligence Score"]));
const IM = rows.map((r) => num(r["Engage Intrinsic Motivation Score"]));
const wellbeing = rows.map((r) => num(r["Wellbeing"]));

console.log(`\n--- Promedios de equipo (vs norma 100) ---`);
console.log(`IE promedio:        ${mean(eq)?.toFixed(1)}`);
console.log(`Navega Emociones:   ${mean(NE)?.toFixed(1)}`);
console.log(`Motiv. Intrínseca:  ${mean(IM)?.toFixed(1)}`);
console.log(`Bienestar:          ${mean(wellbeing)?.toFixed(1)}`);
console.log(`Equilibrio:         ${mean(balance)?.toFixed(1)}`);

console.log(`\n--- Correlaciones clave (las que aparecen en los Hallazgos) ---`);
const r1 = pearson(NE, balance);
const r2 = pearson(NE, qol);
console.log(`Navega Emociones → Equilibrio:      r = ${r1.r?.toFixed(2)}  (n=${r1.n})  [Hallazgo dice +0.64]`);
console.log(`Navega Emociones → Calidad de vida: r = ${r2.r?.toFixed(2)}  (n=${r2.n})  [Hallazgo dice +0.63]`);
