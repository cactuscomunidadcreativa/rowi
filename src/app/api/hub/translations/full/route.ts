// apps/rowi/app/api/hub/translations/full/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

/* =========================================================
   🔍 GET — Listar todas las traducciones combinadas
========================================================= */
export async function GET() {
  try {
    // 📁 Rutas posibles del archivo detectado
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
        console.warn("⚠️ Error al leer translations.detected.json:", err);
      }
    }

    const translations = await prisma.translation.findMany({
      include: { tenant: true },
      orderBy: [{ ns: "asc" }, { key: "asc" }],
    });

    // 🔗 Unir claves detectadas + BD
    const allKeys = new Set([
      ...detected,
      ...translations.map((t) => `${t.ns}.${t.key}`),
    ]);

    const combined = Array.from(allKeys).map((fullKey) => {
      const [ns, key] = fullKey.split(/\.(.+)/); // ✅ parte solo por el primer punto
      const entries = translations.filter((t) => t.ns === ns && t.key === key);

      return {
        ns,
        key,
        es: entries.find((e) => e.lang === "es")?.value || "",
        en: entries.find((e) => e.lang === "en")?.value || "",
        pt: entries.find((e) => e.lang === "pt")?.value || "",
        it: entries.find((e) => e.lang === "it")?.value || "",
        tenants: entries.map((e) => e.tenant?.slug || e.tenant?.name || null).filter(Boolean),
      };
    });

    return NextResponse.json({
      ok: true,
      total: combined.length,
      items: combined,
    });
  } catch (e: any) {
    console.error("❌ Error GET /translations/full:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/* =========================================================
   💾 POST — Crear o actualizar traducciones
========================================================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!Array.isArray(body))
      return NextResponse.json(
        { ok: false, error: "El cuerpo debe ser un array de traducciones" },
        { status: 400 }
      );

    const validLangs = new Set(["es", "en", "pt", "it"]);
    const results: any[] = [];

    for (const item of body.slice(0, 1000)) {
      let { ns, key, lang, value, tenantId, tenantSlug } = item;
      if (!ns || !key || !lang || !validLangs.has(lang.toLowerCase())) continue;

      ns = ns.toLowerCase();
      key = key.trim();
      lang = lang.toLowerCase();

      // 🔍 Resolver tenantId si se da el slug
      if (!tenantId && tenantSlug) {
        const tenant = await prisma.tenant.findUnique({
          where: { slug: tenantSlug },
        });
        tenantId = tenant?.id ?? null;
      }

      const existing = await prisma.translation.findFirst({
        where: { ns, key, lang, tenantId: tenantId ?? null },
      });

      const saved = existing
        ? await prisma.translation.update({
            where: { id: existing.id },
            data: { value },
          })
        : await prisma.translation.create({
            data: { ns, key, lang, value, tenantId: tenantId ?? null },
          });

      results.push(saved);
    }

    return NextResponse.json({
      ok: true,
      message: "✅ Traducciones sincronizadas correctamente",
      total: results.length,
    });
  } catch (e: any) {
    console.error("❌ Error POST /translations/full:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}