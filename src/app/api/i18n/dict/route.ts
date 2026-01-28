import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 🌐 Traducciones con fuente JSON + overrides de BD
 * Endpoint: /api/i18n/dict?lang=es
 * ---------------------------------------------------------
 * 1. Lee primero los archivos JSON (fuente de verdad)
 * 2. Aplica overrides de BD si hay tenantId (personalizaciones)
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const lang = (url.searchParams.get("lang") || "es").toLowerCase();
    const tenantId = url.searchParams.get("tenantId");

    // 1. Cargar desde archivo JSON (fuente de verdad)
    const LOCALES_DIR = path.resolve(process.cwd(), "src/lib/i18n/locales");
    const jsonPath = path.join(LOCALES_DIR, `${lang}.json`);

    let dict: Record<string, string> = {};

    if (fs.existsSync(jsonPath)) {
      try {
        const fileContent = fs.readFileSync(jsonPath, "utf8");
        dict = JSON.parse(fileContent);
      } catch (parseErr) {
        console.error(`❌ Error parseando ${jsonPath}:`, parseErr);
      }
    }

    // Fallback a español si no hay archivo para el idioma
    if (Object.keys(dict).length === 0 && lang !== "es") {
      const esFallback = path.join(LOCALES_DIR, "es.json");
      if (fs.existsSync(esFallback)) {
        try {
          dict = JSON.parse(fs.readFileSync(esFallback, "utf8"));
        } catch {}
      }
    }

    // 2. Aplicar overrides de BD si hay tenantId (personalizaciones por tenant)
    if (tenantId) {
      const tenantOverrides = await prisma.translation.findMany({
        where: { tenantId, lang },
      });

      for (const t of tenantOverrides) {
        const fullKey = `${t.ns}.${t.key}`;
        if (t.value && t.value.trim() !== "") {
          dict[fullKey] = t.value;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      lang,
      total: Object.keys(dict).length,
      dict,
      source: "json" + (tenantId ? "+db-overrides" : ""),
    });
  } catch (error: any) {
    console.error("❌ Error en /api/i18n/dict:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error cargando traducciones", dict: {} },
      { status: 500 }
    );
  }
}