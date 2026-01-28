// apps/rowi/app/api/hub/translations/ui/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/* =========================================================
   📦 UI — Obtiene todas las traducciones agrupadas por namespace
   ---------------------------------------------------------
   ✅ Soporta paginación y búsqueda por ns
   ✅ Evita duplicados
   ✅ Devuelve siempre estructura completa (es, en, pt, it)
========================================================= */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const nsFilter = url.searchParams.get("ns") || undefined;
    const take = parseInt(url.searchParams.get("take") || "2000", 10);
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);
    const flat = url.searchParams.get("flat") === "true";

    const where = nsFilter ? { ns: nsFilter } : {};

    const rows = await prisma.translation.findMany({
      where,
      orderBy: [{ ns: "asc" }, { key: "asc" }, { lang: "asc" }],
      take,
      skip,
    });

    const grouped: Record<string, any[]> = {};
    const flatList: any[] = [];

    for (const r of rows) {
      const ns = r.ns || "global";
      if (!grouped[ns]) grouped[ns] = [];

      let item = grouped[ns].find((x) => x.key === r.key);
      if (!item) {
        item = { key: r.key, es: "", en: "", pt: "", it: "" };
        grouped[ns].push(item);
      }
      item[r.lang] = r.value;

      // También generar lista plana para vistas tabulares
      const fullKey = `${ns}.${r.key}`;
      const flatEntry = flatList.find((f) => f.fullKey === fullKey);
      if (flatEntry) {
        flatEntry[r.lang] = r.value;
      } else {
        flatList.push({
          fullKey,
          ns,
          key: r.key,
          es: r.lang === "es" ? r.value : "",
          en: r.lang === "en" ? r.value : "",
          pt: r.lang === "pt" ? r.value : "",
          it: r.lang === "it" ? r.value : "",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      namespaces: Object.keys(grouped).length,
      total: rows.length,
      ...(flat ? { items: flatList } : { grouped }),
    });
  } catch (e: any) {
    console.error("❌ Error GET /translations/ui:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}