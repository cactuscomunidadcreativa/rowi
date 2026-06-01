import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

/**
 * 🌍 PATCH — Merge locales JSON → Base de datos
 * ----------------------------------------------------------
 * 🔹 Lee src/lib/i18n/locales/es.json, en.json, pt.json, it.json
 * 🔹 Los JSON usan formato plano: "ns.key": "valor"
 * 🔹 Compara con prisma.translation (solo globales, sin tenantId)
 * 🔹 Crea nuevas claves o actualiza las existentes si difieren
 * 🔹 No borra nada
 *
 * ⚠️ Los JSON son la fuente de verdad para traducciones globales
 */
export async function PATCH() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const LANGS = ["es", "en", "pt", "it"];
    const LOCALES_DIR = path.resolve(process.cwd(), "src/lib/i18n/locales");

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const lang of LANGS) {
      const file = path.join(LOCALES_DIR, `${lang}.json`);
      if (!fs.existsSync(file)) {
        console.log(`⚠️ Archivo no encontrado: ${file}`);
        continue;
      }

      const data = JSON.parse(fs.readFileSync(file, "utf8"));

      // El JSON tiene formato plano: "admin.dashboard.title": "Panel"
      for (const fullKey of Object.keys(data)) {
        const rawValue = data[fullKey] ?? "";
        const value = sanitize(rawValue);

        // Separar ns y key: "admin.dashboard.title" → ns="admin", key="dashboard.title"
        const dotIndex = fullKey.indexOf(".");
        if (dotIndex === -1) {
          skipped++;
          continue;
        }

        const ns = fullKey.substring(0, dotIndex);
        const key = fullKey.substring(dotIndex + 1);

        if (!ns || !key) {
          skipped++;
          continue;
        }

        // Buscar solo traducciones globales (sin tenantId)
        const existing = await prisma.translation.findFirst({
          where: { ns, key, lang, tenantId: null },
        });

        if (!existing) {
          await prisma.translation.create({
            data: { ns, key, lang, value, tenantId: null },
          });
          inserted++;
        } else if (existing.value !== value && value.trim() !== "") {
          await prisma.translation.update({
            where: { id: existing.id },
            data: { value },
          });
          updated++;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: "✅ Merge locales → BD completado",
      inserted,
      updated,
      skipped,
    });
  } catch (err: any) {
    console.error("❌ Error en PATCH /hub/translations/merge:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

/* =========================================================
   🧽 Limpieza de valores (evita escapes y caracteres rotos)
========================================================= */
function sanitize(str?: string | null): string {
  if (!str) return "";
  try {
    let clean = String(str);
    clean = Buffer.from(clean, "utf8").toString("utf8");
    clean = clean
      .replace(/[\uD800-\uDFFF]/g, "")
      .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, "")
      .replace(/\\x[0-9A-Fa-f]{0,1}/g, "")
      .replace(/\\u[0-9A-Fa-f]{0,3}/g, "")
      .replace(/\u0000/g, "")
      .trim();
    return clean;
  } catch {
    return "";
  }
}