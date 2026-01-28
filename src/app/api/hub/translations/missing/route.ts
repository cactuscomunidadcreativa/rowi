// apps/rowi/app/api/hub/translations/missing/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

/* =========================================================
   🔍 GET — Traducciones faltantes por idioma
   ---------------------------------------------------------
   🔸 Combina las detectadas y las guardadas
   🔸 Filtra claves inválidas
   🔸 Devuelve solo las que tienen campos vacíos
   🔸 Soporta paginación y filtro por namespace
========================================================= */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const nsFilter = url.searchParams.get("ns") || undefined;
    const take = parseInt(url.searchParams.get("take") || "2000", 10);
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);

    // 📂 Buscar archivo translations.detected.json en posibles rutas
    const possiblePaths = [
      path.resolve(process.cwd(), "translations.detected.json"),
      path.resolve(process.cwd(), "apps/rowi/translations.detected.json"),
      path.resolve(process.cwd(), "apps/rowi/translations/translations.detected.json"),
    ];
    const detectedPath = possiblePaths.find((p) => fs.existsSync(p));

    let detected: string[] = [];
    if (detectedPath) {
      try {
        detected = JSON.parse(fs.readFileSync(detectedPath, "utf8"));
      } catch (err: any) {
        console.warn("⚠️ Error al parsear translations.detected.json:", err);
      }
    }

    // 🧠 Cargar desde BD
    const where = nsFilter ? { ns: nsFilter } : {};
    const translations = await prisma.translation.findMany({
      where,
      include: { tenant: true },
      orderBy: [{ ns: "asc" }, { key: "asc" }],
      take,
      skip,
    });

    // 🔗 Combinar detectadas + BD
    const allKeys = new Set([
      ...detected,
      ...translations.map((t) => `${t.ns}.${t.key}`),
    ]);

    // 🧹 Limpieza de claves
    const validKeys = Array.from(allKeys).filter(
      (k) =>
        k &&
        k.length > 3 &&
        !k.includes("${") &&
        !/[\/@\[\]]/.test(k) &&
        !/^[^a-zA-Z0-9]+$/.test(k)
    );

    // 🧩 Generar estructura
    const combined = validKeys.map((fullKey) => {
      const [ns, key] = fullKey.split(/\.(.+)/); // ✅ solo el primer punto
      const entries = translations.filter((t) => t.ns === ns && t.key === key);
      const langs = ["es", "en", "pt", "it"];
      const values: Record<string, string> = {};

      for (const lang of langs) {
        values[lang] = entries.find((e) => e.lang === lang)?.value || "";
      }

      const missingLangs = langs.filter((l) => !values[l]);

      return {
        ns,
        key,
        ...values,
        missingLangs,
        tenants: entries.map((e) => e.tenant?.slug || e.tenant?.name || null).filter(Boolean),
      };
    });

    const missing = combined.filter((t) => t.missingLangs.length > 0);

    return NextResponse.json({
      ok: true,
      total: missing.length,
      take,
      skip,
      missing,
    });
  } catch (e: any) {
    console.error("❌ Error en /translations/missing:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}