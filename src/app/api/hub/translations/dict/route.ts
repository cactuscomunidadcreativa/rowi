// src/app/api/i18n/dict/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { ensureTranslations } from "@/core/startup/ensureTranslations";

// 👇 Fuerza ejecución dinámica (necesario por uso de req.url)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 1800; // 30 min

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const lang = (url.searchParams.get("lang") || "es").toLowerCase();
    const tenantId = url.searchParams.get("tenantId");
    const ns = url.searchParams.get("ns");
    const sync = url.searchParams.get("sync") === "true";

    if (sync) {
      console.log("🔄 Sincronizando traducciones antes de generar el diccionario...");
      await ensureTranslations();
    }

    const LANGS_ORDER = ["es", lang, "en", "pt", "it"].filter(
      (v, i, a) => a.indexOf(v) === i
    );

    const whereClause = tenantId
      ? { OR: [{ tenantId: null }, { tenantId }], ...(ns ? { ns } : {}) }
      : { tenantId: null, ...(ns ? { ns } : {}) };

    const translations = await prisma.translation.findMany({
      where: whereClause,
      orderBy: [{ ns: "asc" }, { key: "asc" }],
    });

    const map = new Map<string, Record<string, string>>();
    for (const t of translations) {
      const fullKey = `${t.ns}.${t.key}`;
      const entry = map.get(fullKey) || {};
      entry[t.lang] = t.value || "";
      map.set(fullKey, entry);
    }

    const dict: Record<string, string> = {};
    for (const [fullKey, langs] of map.entries()) {
      let value = "";
      for (const lng of LANGS_ORDER) {
        if (langs[lng] && langs[lng].trim() !== "") {
          value = langs[lng];
          break;
        }
      }
      dict[fullKey] = value || "";
    }

    const res = NextResponse.json({
      ok: true,
      lang,
      tenantId,
      ns: ns || "all",
      total: Object.keys(dict).length,
      dict,
    });

    res.headers.set(
      "Cache-Control",
      "public, s-maxage=1800, stale-while-revalidate=60"
    );

    return res;
  } catch (e: any) {
    console.error("❌ Error en /api/i18n/dict:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}