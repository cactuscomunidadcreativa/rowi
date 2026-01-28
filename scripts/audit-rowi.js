#!/usr/bin/env node

/**
 * ============================================================
 *  ROWI AUDIT SCRIPT — Limpieza de startup, imports y duplicados
 * ============================================================
 * Este script:
 *  - Detecta archivos duplicados o versiones viejas
 *  - Detecta imports rotos
 *  - Detecta funciones ensure*/assign* duplicadas
 *  - Genera un reporte con recomendaciones
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = process.cwd();
const SRC = path.join(PROJECT_ROOT, "src");
const STARTUP = path.join(SRC, "core", "startup");

let report = [];
function log(msg) {
  console.log(msg);
  report.push(msg);
}

function scanFiles(dir) {
  let files = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) files = files.concat(scanFiles(full));
    else files.push(full);
  }
  return files;
}

log("====== ROWI AUDIT SCRIPT ======\n");

const startupFiles = scanFiles(STARTUP);

// 1) Detectar archivos sospechosos / duplicados
const deprecated = [
  "cloneAgents.ts",
  "cloneBaseAssests.ts",
  "ensureAgents.ts",
  "ensureSystemAssets.ts",
  "ensureRowiverseCommunity.ts",
  "exportLocales.ts",
  "exportTranslationsToLocales.ts",
  "setup.ts",
  "syncAgents.ts",
  "assignAgents.ts",
];

log("🔍 Revisando STARTUP…\n");

for (const file of startupFiles) {
  const base = path.basename(file);
  if (deprecated.includes(base)) {
    log(`⚠️ Archivo obsoleto detectado: ${file}`);
  }
}

// 2) Buscar imports rotos
log("\n🔍 Buscando imports rotos…\n");
const projectFiles = scanFiles(SRC);

for (const file of projectFiles) {
  if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;

  const content = fs.readFileSync(file, "utf8");

  const importMatches = [...content.matchAll(/from\s+["'](.+?)["']/g)];

  for (const m of importMatches) {
    const importPath = m[1];
    if (!importPath.startsWith(".")) continue;

    const resolved = path.resolve(path.dirname(file), importPath);
    const candidates = [
      resolved,
      resolved + ".ts",
      resolved + ".tsx",
      path.join(resolved, "index.ts"),
    ];

    const exists = candidates.some(fs.existsSync);
    if (!exists) {
      log(`❌ Import roto: ${importPath} en ${file}`);
    }
  }
}

// 3) Detectar funciones ensure*/assign* duplicadas
log("\n🔍 Buscando funciones duplicadas ensure*/assign* …\n");

const functionMap = {};

for (const file of startupFiles) {
  const content = fs.readFileSync(file, "utf8");
  const matches = [...content.matchAll(/export async function (\w+)/g)];
  for (const m of matches) {
    const fn = m[1];
    if (!functionMap[fn]) functionMap[fn] = [];
    functionMap[fn].push(file);
  }
}

for (const fn in functionMap) {
  if (functionMap[fn].length > 1) {
    log(`⚠️ Función duplicada: ${fn} aparece en:\n${functionMap[fn].join("\n")}`);
  }
}

// 4) Guardar reporte
const outFile = path.join(SRC, "logs", "cleanup-report.txt");
fs.writeFileSync(outFile, report.join("\n"));
log(`\n📄 Reporte guardado en: ${outFile}`);

console.log("\n✅ Auditoría completada.");