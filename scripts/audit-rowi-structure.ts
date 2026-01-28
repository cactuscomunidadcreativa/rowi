import fs from "fs";
import path from "path";
import chalk from "chalk";

const STRUCTURE_FILE = path.resolve("rowi_structure_full.txt");

console.log(chalk.cyan("🔍 Analizando estructura de Rowi..."));

if (!fs.existsSync(STRUCTURE_FILE)) {
  console.error(chalk.red(`❌ No se encontró ${STRUCTURE_FILE}`));
  process.exit(1);
}

const lines = fs.readFileSync(STRUCTURE_FILE, "utf8").split("\n");

// -------------------------------------------------------
// 🔹 Detectores básicos
// -------------------------------------------------------
const emptyDirs: string[] = [];
const bakFiles: string[] = [];
const apiRoutes: string[] = [];
const apiWithoutRoute: string[] = [];
const i18nFiles: string[] = [];
const suspicious: string[] = [];

// Detecta niveles y tipos de entrada
for (const line of lines) {
  const clean = line.trim().replace(/^├──|│|└──|\s+/g, "").trim();
  if (!clean) continue;

  // Archivos
  if (clean.endsWith(".bak")) bakFiles.push(clean);
  if (clean.includes("i18n")) i18nFiles.push(clean);
  if (clean.includes("api/") && clean.endsWith("/")) apiRoutes.push(clean);

  // Carpetas vacías o raras
  if (clean.endsWith("/") && clean.match(/\/$/)) emptyDirs.push(clean);

  // Archivos sin route.ts
  if (clean.includes("api/") && !clean.includes("route.ts") && clean.endsWith(".ts"))
    apiWithoutRoute.push(clean);

  // Archivos sospechosos (duplicados o .save)
  if (clean.match(/\.save|\.old|\.copy/i)) suspicious.push(clean);
}

// -------------------------------------------------------
// 🔹 Reglas de validación
// -------------------------------------------------------
console.log(chalk.bold("\n📦 Resultados:"));

console.log(chalk.cyan("\n1️⃣ Archivos .bak (duplicados temporales):"));
if (bakFiles.length) console.log(chalk.yellow(bakFiles.join("\n")));
else console.log(chalk.green("✅ Sin archivos .bak"));

console.log(chalk.cyan("\n2️⃣ Archivos sospechosos (.save, .old, .copy):"));
if (suspicious.length) console.log(chalk.yellow(suspicious.join("\n")));
else console.log(chalk.green("✅ Sin archivos sospechosos"));

console.log(chalk.cyan("\n3️⃣ Carpetas vacías o con nombres anómalos:"));
if (emptyDirs.length) console.log(chalk.yellow(emptyDirs.join("\n")));
else console.log(chalk.green("✅ Sin carpetas vacías detectadas"));

console.log(chalk.cyan("\n4️⃣ Estructura i18n:"));
if (i18nFiles.some(f => f.includes("useI18n.ts"))) console.log(chalk.green("✅ i18n funcional (useI18n.ts presente)"));
else console.log(chalk.red("⚠️ Falta useI18n.ts o estructura i18n incompleta"));

console.log(chalk.cyan("\n5️⃣ Rutas API sin route.ts:"));
if (apiWithoutRoute.length) console.log(chalk.red(apiWithoutRoute.join("\n")));
else console.log(chalk.green("✅ Todas las rutas API tienen route.ts"));

console.log(chalk.cyan("\n6️⃣ Resumen general:"));
console.log(chalk.white(`- Total .bak: ${bakFiles.length}`));
console.log(chalk.white(`- Archivos sospechosos: ${suspicious.length}`));
console.log(chalk.white(`- Carpetas vacías: ${emptyDirs.length}`));
console.log(chalk.white(`- API sin route.ts: ${apiWithoutRoute.length}`));

console.log(chalk.bold.green("\n✅ Auditoría completada.\n"));