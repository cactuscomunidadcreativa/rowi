// apps/rowi/app/api/hub/translations/export/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { stringify } from "csv-stringify/sync";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

/* =========================================================
   🌍 POST — Exportar JSON locales a /src/lib/i18n/locales/
========================================================= */
export async function POST() {
  try {
    console.log("📦 Exportando traducciones a archivos locales...");

    const langs = ["es", "en", "pt", "it"];
    // ✅ ruta corregida
    const basePath = path.resolve(process.cwd(), "src/lib/i18n/locales");

    if (!fs.existsSync(basePath)) fs.mkdirSync(basePath, { recursive: true });

    for (const lang of langs) {
      const translations = await prisma.translation.findMany({
        where: { lang },
        orderBy: [{ ns: "asc" }, { key: "asc" }],
      });

      const dict: Record<string, string> = {};
      for (const t of translations) {
        dict[`${t.ns}.${t.key}`] = t.value || "";
      }

      const filePath = path.join(basePath, `${lang}.json`);
      fs.writeFileSync(filePath, JSON.stringify(dict, null, 2), "utf8");
      console.log(`✅ Guardado: ${filePath} (${Object.keys(dict).length} claves)`);
    }

    return NextResponse.json({
      ok: true,
      message: "✅ Traducciones exportadas correctamente a JSON locales",
    });
  } catch (err: any) {
    console.error("❌ Error exportando locales:", err);
    return NextResponse.json(
      { ok: false, error: "Error exportando locales" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🌐 GET — Exportación global a CSV (Rowi Core + Hub Maestro)
========================================================= */
export async function GET() {
  try {
    // ✅ ruta corregida
    const localesDir = path.resolve(process.cwd(), "src/lib/i18n/locales");

    if (!fs.existsSync(localesDir)) {
      console.warn("⚠️ No se encontró carpeta de locales:", localesDir);
    }

    const files = fs.existsSync(localesDir)
      ? fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"))
      : [];

    const rowiLocales: Record<string, any> = {};

    for (const file of files) {
      const lang = file.replace(".json", "");
      const filePath = path.join(localesDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      rowiLocales[lang] = flattenKeys(data);
    }

    const dbTranslations = await prisma.translation.findMany({
      where: { tenantId: "rowi-master" },
      orderBy: { updatedAt: "desc" },
    });

    const merged: Record<string, any> = {};

    for (const lang of Object.keys(rowiLocales)) {
      for (const key of Object.keys(rowiLocales[lang])) {
        if (!merged[key]) merged[key] = { source: "Rowi Core", ns: "core", key };
        merged[key][lang] = rowiLocales[lang][key];
      }
    }

    for (const t of dbTranslations) {
      const key = `${t.ns}:${t.key}`;
      if (!merged[key]) merged[key] = { source: "Hub Maestro", ns: t.ns, key: t.key };
      merged[key][t.lang] = t.value;
      merged[key].updatedAt = t.updatedAt?.toISOString?.() ?? "";
    }

    const csv = stringify(Object.values(merged), {
      header: true,
      columns: ["source", "ns", "key", "es", "en", "pt", "it", "updatedAt"],
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=translations-global.csv`,
      },
    });
  } catch (err: any) {
    console.error("❌ Error exportando traducciones globales:", err);
    return NextResponse.json(
      { error: "Error exportando traducciones globales" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🧩 Helper — Aplana JSON de traducciones anidadas
========================================================= */
function flattenKeys(obj: any, prefix = ""): Record<string, string> {
  return Object.entries(obj).reduce((acc, [k, v]) => {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null) {
      Object.assign(acc, flattenKeys(v, fullKey));
    } else {
      acc[fullKey] = String(v);
    }
    return acc;
  }, {} as Record<string, string>);
}