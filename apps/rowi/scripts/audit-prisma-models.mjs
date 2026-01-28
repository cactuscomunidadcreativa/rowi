#!/usr/bin/env node
// 🔍 Auditoría de modelos Prisma usados en el código Rowi
// ------------------------------------------------------
// Este script compara los modelos definidos en schema.prisma
// contra los que realmente se usan en el código fuente.

import fs from "fs";
import path from "path";

// Ruta absoluta fija a tu schema.prisma
const prismaSchema = "/Users/eduardogonzalez/Desktop/Cactus/CactusMonorepo/apps/rowi/prisma/schema.prisma";
const appRoot = path.dirname(path.dirname(prismaSchema)); // → apps/rowi

if (!fs.existsSync(prismaSchema)) {
  console.error(`❌ No se encontró schema.prisma en: ${prismaSchema}`);
  process.exit(1);
}

// 1️⃣ Lee todos los modelos definidos en schema.prisma
const schema = fs.readFileSync(prismaSchema, "utf8");
const modelMatches = [...schema.matchAll(/model\s+(\w+)/g)];
const modelsInSchema = modelMatches.map((m) => m[1]);
console.log(`📘 Modelos en schema.prisma (${modelsInSchema.length}):`);
console.log(modelsInSchema.join(", "));

// 2️⃣ Escanea el código para buscar prisma.<modelo>
function walk(dir, arr = []) {
  if (!fs.existsSync(dir)) return arr;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (f.startsWith(".")) continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, arr);
    else if (f.endsWith(".ts") || f.endsWith(".tsx")) arr.push(full);
  }
  return arr;
}

const srcDir = path.join(appRoot, "src");
if (!fs.existsSync(srcDir)) {
  console.error(`❌ No se encontró carpeta src en ${srcDir}`);
  process.exit(1);
}

console.log(`\n🔍 Escaneando código fuente en: ${srcDir}`);
const files = walk(srcDir);

const foundModels = new Set();
for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const matches = [...content.matchAll(/prisma\.(\w+)/g)];
  for (const m of matches) foundModels.add(m[1]);
}

// 3️⃣ Comparar modelos
const usedModels = Array.from(foundModels);
const missing = usedModels.filter((m) => !modelsInSchema.includes(m));
const unused = modelsInSchema.filter((m) => !usedModels.includes(m));

console.log("\n✅ Modelos Prisma usados en código:", usedModels.length);
console.log(usedModels.join(", ") || "(ninguno detectado)");

console.log("\n❌ Modelos usados pero NO existen en schema.prisma:", missing.length);
if (missing.length) console.table(missing);

console.log("\n🧹 Modelos definidos en schema pero NO usados en código:", unused.length);
if (unused.length) console.table(unused);

// 4️⃣ Guardar reporte
const backupDir = path.join(appRoot, ".backups");
fs.mkdirSync(backupDir, { recursive: true });

const outPath = path.join(backupDir, `audit-prisma-${Date.now()}.json`);
fs.writeFileSync(
  outPath,
  JSON.stringify({ modelsInSchema, usedModels, missing, unused }, null, 2),
  "utf8"
);

console.log(`\n📄 Reporte guardado en ${outPath}`);
console.log("✨ Auditoría Prisma completada.\n");