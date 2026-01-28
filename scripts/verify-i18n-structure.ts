#!/usr/bin/env tsx
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { execSync } from "child_process";

const FIX_MODE = process.argv.includes("--fix");

const ROOT = process.cwd();
const I18N_DIR = path.join(ROOT, "src/lib/i18n");
const TRANSLATIONS_DIR = path.join(ROOT, "translations");
const PRISMA_SCHEMA = path.join(ROOT, "prisma/schema.prisma");
const BACKUP_DIR = path.join(ROOT, `.backups/i18n-fix-${new Date().toISOString().split("T")[0]}`);

const log = {
  info: (msg: string) => console.log(chalk.cyan("ℹ️  " + msg)),
  ok: (msg: string) => console.log(chalk.green("✅ " + msg)),
  warn: (msg: string) => console.log(chalk.yellow("⚠️  " + msg)),
  err: (msg: string) => console.log(chalk.red("❌ " + msg)),
};

/* =========================================================
   🧩 Helper: Safe Write + Backup
========================================================= */
function safeWrite(filePath: string, content: string) {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (fs.existsSync(filePath)) {
    const backupPath = path.join(BACKUP_DIR, path.basename(filePath));
    fs.copyFileSync(filePath, backupPath);
  }
  fs.writeFileSync(filePath, content, "utf8");
}

/* =========================================================
   1️⃣ Verificar estructura i18n
========================================================= */
function ensureI18nStructure() {
  log.info("Verificando estructura /src/lib/i18n...");
  const requiredFiles = [
    "index.ts",
    "useI18n.ts",
    "getI18n.ts",
    "constants.ts",
    "locales/es.json",
    "locales/en.json",
    "locales/pt.json",
    "locales/it.json",
  ];
  let fixed = false;

  for (const relPath of requiredFiles) {
    const full = path.join(I18N_DIR, relPath);
    if (!fs.existsSync(path.dirname(full))) fs.mkdirSync(path.dirname(full), { recursive: true });
    if (!fs.existsSync(full)) {
      if (FIX_MODE) {
        const isJson = full.endsWith(".json");
        safeWrite(full, isJson ? "{}" : "// Auto-generated placeholder\n");
        log.ok(`Creado: ${relPath}`);
        fixed = true;
      } else {
        log.warn(`Falta archivo: ${relPath}`);
      }
    }
  }

  return fixed;
}

/* =========================================================
   2️⃣ Verificar /translations
========================================================= */
function ensureTranslationsDir() {
  log.info("Verificando /translations...");
  if (!fs.existsSync(TRANSLATIONS_DIR)) {
    if (FIX_MODE) fs.mkdirSync(TRANSLATIONS_DIR, { recursive: true });
    log.ok("Creado directorio /translations");
  }

  const required = [
    "translations-ui-complete.csv",
    "translations.internal-scope.csv",
    "translations.ui-scope.csv",
    "translations.detected.json",
  ];
  let fixed = false;
  for (const f of required) {
    const full = path.join(TRANSLATIONS_DIR, f);
    if (!fs.existsSync(full)) {
      if (FIX_MODE) {
        safeWrite(full, f.endsWith(".json") ? "[]" : "");
        log.ok(`Archivo generado: ${f}`);
        fixed = true;
      } else {
        log.warn(`Falta archivo: ${f}`);
      }
    }
  }
  return fixed;
}

/* =========================================================
   3️⃣ Verificar Prisma Translation
========================================================= */
function ensurePrismaModel() {
  log.info("Verificando modelo Translation en Prisma...");
  const content = fs.readFileSync(PRISMA_SCHEMA, "utf8");
  if (!content.includes("model Translation")) {
    if (FIX_MODE) {
      const model = `
model Translation {
  id        String   @id @default(cuid())
  ns        String
  key       String
  lang      String
  value     String
  tenantId  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;
      fs.appendFileSync(PRISMA_SCHEMA, "\n" + model);
      execSync("npx prisma format", { stdio: "ignore" });
      log.ok("Modelo Translation añadido a Prisma.");
      return true;
    } else {
      log.warn("⚠️  Falta el modelo Translation en schema.prisma");
    }
  } else {
    log.ok("Modelo Translation presente.");
  }
  return false;
}

/* =========================================================
   4️⃣ Corregir imports antiguos
========================================================= */
function fixImports() {
  log.info("Revisando imports antiguos...");
  const exts = [".ts", ".tsx"];
  const dirs = ["src"];
  let fixed = 0;

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((e) =>
        e.isDirectory()
          ? fs
              .readdirSync(path.join(dir, e.name))
              .filter((f) => exts.some((ext) => f.endsWith(ext)))
              .map((f) => path.join(dir, e.name, f))
          : [path.join(dir, e.name)]
      )
      .filter((f) => exts.some((ext) => f.endsWith(ext)));

    for (const file of files) {
      let text = fs.readFileSync(file, "utf8");
      if (text.includes('@/i18n') || text.includes('@/app/i18n')) {
        const updated = text
          .replace(/@\/i18n/g, "@/lib/i18n")
          .replace(/@\/app\/i18n/g, "@/lib/i18n");
        if (updated !== text) {
          if (FIX_MODE) {
            safeWrite(file, updated);
            fixed++;
          } else {
            log.warn(`Import antiguo detectado en: ${file}`);
          }
        }
      }
    }
  }

  if (fixed > 0) log.ok(`Importaciones corregidas: ${fixed}`);
  return fixed > 0;
}

/* =========================================================
   🚀 Main
========================================================= */
async function main() {
  console.log(chalk.magenta.bold("\n🔍 Verificando estructura i18n de Rowi...\n"));

  const repaired = [
    ensureI18nStructure(),
    ensureTranslationsDir(),
    ensurePrismaModel(),
    fixImports(),
  ].some(Boolean);

  if (repaired) {
    if (FIX_MODE) log.ok("🎯 Correcciones aplicadas con éxito.");
    else log.warn("Ejecuta con --fix para aplicar las correcciones automáticamente.");
  } else {
    log.ok("🎯 Todo está correcto, sin cambios necesarios.");
  }
}

main().catch((e) => log.err(e.message));