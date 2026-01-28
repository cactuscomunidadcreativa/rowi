import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/**
 * 📘 GET /api/hub/translations
 * ---------------------------------------------------------
 * 🔹 Devuelve TODAS las traducciones existentes en la base de datos
 * 🔹 Permite formato "list" (por defecto) o "dict"
 * 🔹 Permite filtrar opcionalmente por idioma (?lang=en)
 * 🔹 Ordena por namespace y clave
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const format = (url.searchParams.get("format") || "list") as "list" | "dict";
    const take = parseInt(url.searchParams.get("take") || "10000", 10);
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);
    const qLang = url.searchParams.get("lang");
    const headerLang = req.headers.get("accept-language") || "";
    const lang = (qLang || headerLang.split(",")[0]?.slice(0, 2) || "es").toLowerCase();

    /* =========================================================
       🔍 Recuperar TODAS las traducciones existentes
    ========================================================== */
    const translations = await prisma.translation.findMany({
      orderBy: [{ ns: "asc" }, { key: "asc" }, { lang: "asc" }],
      take,
      skip,
    });

    if (!translations.length) {
      return NextResponse.json({
        ok: true,
        total: 0,
        lang,
        rows: [],
        message: "⚠️ No se encontraron traducciones en la base de datos.",
      });
    }

    /* =========================================================
       📦 Agrupar por namespace + key
    ========================================================== */
    const grouped: Record<string, any> = {};
    for (const t of translations) {
      const full = `${t.ns}.${t.key}`;
      if (!grouped[full]) grouped[full] = { ns: t.ns, key: t.key };
      grouped[full][t.lang] = t.value || "";
    }

    const rowsGrouped = Object.values(grouped);

    if (format === "dict") {
      const dict: Record<string, string> = {};
      for (const g of rowsGrouped as any[]) {
        dict[`${g.ns}.${g.key}`] = g[lang] || g.es || g.en || g.pt || g.it || "";
      }
      return NextResponse.json({
        ok: true,
        lang,
        total: Object.keys(dict).length,
        dict,
      });
    }

    return NextResponse.json({
      ok: true,
      lang,
      total: rowsGrouped.length,
      rows: rowsGrouped,
    });
  } catch (err: any) {
    console.error("❌ Error GET /hub/translations (modo total):", err);
    return NextResponse.json(
      { ok: false, error: "Error interno al obtener todas las traducciones" },
      { status: 500 },
    );
  }
}