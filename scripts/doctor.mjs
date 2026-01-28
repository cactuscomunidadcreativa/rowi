#!/usr/bin/env node
/**
 * 🩺 Rowi Doctor — Diagnóstico de Salud del Proyecto
 * ---------------------------------------------------------
 * - Ejecuta `pnpm tsc --noEmit`
 * - Clasifica los errores por tipo
 * - Genera reporte visual y JSON
 * - NO modifica código, solo analiza
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, "apps/rowi/.backups");
const REPORT_PATH = path.join(REPORT_DIR, `doctor-report-${new Date().toISOString().slice(0,10)}.json`);

if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

console.log("🩺 Ejecutando auditoría TypeScript...");
let output = "";

try {
  output = execSync("pnpm tsc --noEmit", { encoding: "utf8" });
  console.log("✅ No se encontraron errores TypeScript.");
  process.exit(0);
} catch (err) {
  output = err.stdout?.toString() || err.message;
  console.log("⚠️ Se detectaron errores, clasificando...");
}

/* =========================================================
   🔍 Clasificador inteligente de errores
========================================================= */
const lines = output.split("\n");
const categories = {
  prisma: [],
  nextParams: [],
  openai: [],
  i18n: [],
  missingModule: [],
  auth: [],
  other: [],
};

for (const line of lines) {
  if (/prisma/i.test(line)) categories.prisma.push(line);
  else if (/params.*Promise/i.test(line)) categories.nextParams.push(line);
  else if (/ChatCompletion|openai|messages/i.test(line)) categories.openai.push(line);
  else if (/i18n|translation|t\(/i.test(line)) categories.i18n.push(line);
  else if (/Cannot find module/i.test(line)) categories.missingModule.push(line);
  else if (/auth|nextauth/i.test(line)) categories.auth.push(line);
  else if (line.trim().length > 0) categories.other.push(line);
}

/* =========================================================
   📊 Resumen visual
========================================================= */
const summary = Object.entries(categories).map(([key, arr]) => ({
  key,
  count: arr.length,
}));

console.log("\n📋 Resumen del diagnóstico:");
for (const { key, count } of summary) {
  const emoji =
    key === "prisma" ? "🧩" :
    key === "nextParams" ? "🔗" :
    key === "openai" ? "🤖" :
    key === "i18n" ? "🌍" :
    key === "missingModule" ? "📦" :
    key === "auth" ? "🔐" : "⚙️";
  console.log(`${emoji} ${key.padEnd(15)} ${count} errores`);
}

/* =========================================================
   🧾 Guardar reporte detallado
========================================================= */
const report = {
  date: new Date().toISOString(),
  summary,
  errors: categories,
};

fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
console.log(`\n💾 Reporte guardado en: ${REPORT_PATH}`);
console.log("\n🧠 Tip: abre el JSON en VSCode para navegar entre errores fácilmente.\n");