#!/usr/bin/env tsx
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import chalk from "chalk";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "src/lib/i18n/locales");
const BACKUP_DIR = path.join(ROOT, `.backups/i18n-sync-${new Date().toISOString().split("T")[0]}`);
const LANGS = ["es", "en", "pt", "it"];

const MODE_IMPORT = process.argv.includes("--import");
const MODE_MERGE = process.argv.includes("--merge");

const log = {
  info: (msg: string) => console.log(chalk.cyan("ℹ️  " + msg)),
  ok: (msg: string) => console.log(chalk.green("✅ " + msg)),
  warn: (msg: string) => console.log(chalk.yellow("⚠️  " + msg)),
  err: (msg: string) => console.log(chalk.red("❌ " + msg)),
};

// =========================================================
// 📁 Helpers
// =========================================================
function ensureDirs() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function backupFile(file: string) {
  if (fs.existsSync(file)) {
    const backupPath = path.join(BACKUP_DIR, path.basename(file));
    fs.copyFileSync(file, backupPath);
  }
}

function readJsonSafe(file: string): any {
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf8");
      return JSON.parse(content);
    }
  } catch (e) {
    log.warn(`Archivo JSON inválido: ${file}`);
  }
  return {};
}

// 🧽 Sanea cadenas antes de insertarlas
function sanitize(str?: string | null): string {
  if (!str) return "";
  try {
    let clean = String(str);
    // Normaliza a UTF-8 seguro
    clean = Buffer.from(clean, "utf8").toString("utf8");
    // Elimina caracteres problemáticos
    clean = clean
      .replace(/[\uD800-\uDFFF]/g, "") // surrogates inválidos
      .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, "") // control chars
      .replace(/\\x[0-9A-Fa-f]{0,1}/g, "") // escapes rotos
      .replace(/\\u[0-9A-Fa-f]{0,3}/g, "") // escapes unicode cortos
      .replace(/\u0000/g, "")
      .trim();
    // Limita longitud por seguridad
    if (clean.length > 5000) clean = clean.slice(0, 5000);
    return clean;
  } catch {
    return "";
  }
}

// =========================================================
// 🧠 EXPORT — BD → JSON
// =========================================================
async function exportFromDB(): Promise<Record<string, any>> {
  log.info("📦 Exportando traducciones desde BD...");
  const translations = await prisma.translation.findMany();
  const grouped: Record<string, Record<string, Record<string, string>>> = {};

  for (const { ns, key, lang, value } of translations) {
    if (!LANGS.includes(lang)) continue;
    grouped[lang] ??= {};
    grouped[lang][ns] ??= {};
    grouped[lang][ns][key] = value || "";
  }

  ensureDirs();

  for (const lang of LANGS) {
    const file = path.join(OUT_DIR, `${lang}.json`);
    backupFile(file);
    const data = grouped[lang] || {};
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
    log.ok(`Archivo actualizado: ${lang}.json`);
  }

  return grouped;
}

// =========================================================
// 🧠 IMPORT — JSON → BD
// =========================================================
async function importToDB(): Promise<number> {
  log.info("📥 Importando traducciones locales → BD...");
  ensureDirs();

  let changes = 0;

  for (const lang of LANGS) {
    const file = path.join(OUT_DIR, `${lang}.json`);
    if (!fs.existsSync(file)) {
      log.warn(`No existe ${lang}.json`);
      continue;
    }

    const content = readJsonSafe(file);
    for (const ns of Object.keys(content)) {
      for (const key of Object.keys(content[ns])) {
        const rawValue = content[ns][key] || "";
        const value = sanitize(rawValue);

        const existing = await prisma.translation.findFirst({
          where: { ns, key, lang },
        });

        if (existing) {
          if (existing.value !== value) {
            await prisma.translation.update({
              where: { id: existing.id },
              data: { value },
            });
            changes++;
          }
        } else {
          await prisma.translation.create({
            data: { ns, key, lang, value },
          });
          changes++;
        }
      }
    }
  }

  return changes;
}

// =========================================================
// 🧬 MERGE — BD ⇄ JSON (Bidireccional Inteligente)
// =========================================================
async function mergeBothWays() {
  log.info("🔁 Iniciando MERGE bidireccional (BD ⇄ JSON)...");
  ensureDirs();

  const dbData = await prisma.translation.findMany();
  const dbGrouped: Record<string, Record<string, Record<string, string>>> = {};
  for (const { ns, key, lang, value } of dbData) {
    dbGrouped[lang] ??= {};
    dbGrouped[lang][ns] ??= {};
    dbGrouped[lang][ns][key] = value || "";
  }

  const fileData: Record<string, any> = {};
  for (const lang of LANGS) {
    const file = path.join(OUT_DIR, `${lang}.json`);
    fileData[lang] = readJsonSafe(file);
  }

  let updated = 0;
  let inserted = 0;

  for (const lang of LANGS) {
    const jsonLang = fileData[lang] || {};
    const dbLang = dbGrouped[lang] || {};
    const merged: Record<string, Record<string, string>> = {};

    const allNs = new Set([...Object.keys(jsonLang), ...Object.keys(dbLang)]);
    for (const ns of allNs) {
      merged[ns] = {};
      const keys = new Set([
        ...Object.keys(jsonLang[ns] || {}),
        ...Object.keys(dbLang[ns] || {}),
      ]);

      for (const key of keys) {
        const jsonVal = jsonLang[ns]?.[key] ?? "";
        const dbVal = dbLang[ns]?.[key] ?? "";
        const finalVal = sanitize(jsonVal || dbVal || "");
        merged[ns][key] = finalVal;

        try {
          const exists = await prisma.translation.findFirst({ where: { ns, key, lang } });
          if (!exists) {
            await prisma.translation.create({ data: { ns, key, lang, value: finalVal } });
            inserted++;
          } else if (exists.value !== finalVal) {
            await prisma.translation.update({
              where: { id: exists.id },
              data: { value: finalVal },
            });
            updated++;
          }
        } catch (err: any) {
          console.error(`❌ Error en ${ns}.${key} (${lang}):`, err.message);
          console.error("Valor problemático:", finalVal);
          continue;
        }
      }
    }

    const file = path.join(OUT_DIR, `${lang}.json`);
    backupFile(file);
    fs.writeFileSync(file, JSON.stringify(merged, null, 2), "utf8");
    log.ok(`Archivo MERGED: ${lang}.json`);
  }

  log.ok(`\n✅ MERGE completado.`);
  log.info(`Nuevas: ${inserted} · Actualizadas: ${updated}`);
}

// =========================================================
// 🎯 Main
// =========================================================
async function main() {
  console.log(
    chalk.magenta.bold(
      MODE_MERGE
        ? "\n🔁 MODO MERGE — Sincronización BD ⇄ JSON\n"
        : MODE_IMPORT
        ? "\n📤 MODO IMPORT — Local → BD\n"
        : "\n🌍 MODO EXPORT — BD → Local\n"
    )
  );

  if (MODE_MERGE) await mergeBothWays();
  else if (MODE_IMPORT) {
    const changes = await importToDB();
    log.ok(`\n🎯 Import completado con ${changes} cambios.`);
  } else {
    await exportFromDB();
  }

  console.log(chalk.green("\n🎉 Sincronización completa.\n"));
}

main().catch((err) => {
  log.err(err.message);
  process.exit(1);
});