// apps/rowi/app/api/hub/translations/import/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";
import { parse } from "csv-parse/sync";

export const runtime = "nodejs";

/* =========================================================
   📥 IMPORT — Actualiza traducciones desde CSV exportado
   ---------------------------------------------------------
   ✅ Soporta CSV en formato UTF-8 con o sin BOM
   ✅ Normaliza cabeceras (Namespace / ns / NS, Key / key, etc.)
   ✅ No borra nada, solo actualiza o crea
   ✅ Solo modifica celdas cuyo valor cambia
========================================================= */
export async function POST(req: Request) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No se envió archivo CSV" },
        { status: 400 }
      );
    }

    // 🧩 Leer contenido CSV (UTF-8 seguro)
    const buffer = Buffer.from(await file.arrayBuffer());
    let csvContent = buffer.toString("utf8");

    // Remover posible BOM (\uFEFF)
    if (csvContent.charCodeAt(0) === 0xfeff) {
      csvContent = csvContent.slice(1);
    }

    // 🧠 Parsear CSV (autodetectando cabeceras)
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const LANGS = ["es", "en", "pt", "it"];
    let updated = 0;
    let created = 0;
    const logs: string[] = [];

    for (const row of records) {
      // 🧩 Detectar namespace y clave
      const ns = row.Namespace || row.namespace || row.ns || "";
      const key = row.Key || row.key || "";
      if (!ns || !key) continue;

      // 🔡 Normalizar
      const normNs = ns.trim().toLowerCase();
      const normKey = key.trim();

      // 🌍 Extraer idiomas válidos
      const langs = LANGS.map((lang) => ({
        lang,
        value: row[lang.toUpperCase()] || row[lang] || "",
      }));

      for (const { lang, value } of langs) {
        const trimmed = (value || "").toString().trim();
        if (!trimmed) continue;

        const existing = await prisma.translation.findFirst({
          where: { ns: normNs, key: normKey, lang },
        });

        if (existing) {
          if (existing.value !== trimmed) {
            await prisma.translation.update({
              where: { id: existing.id },
              data: { value: trimmed },
            });
            updated++;
            logs.push(`📝 [UPDATE] ${lang} → ${normNs}.${normKey}`);
          }
        } else {
          await prisma.translation.create({
            data: { ns: normNs, key: normKey, lang, value: trimmed },
          });
          created++;
          logs.push(`✨ [CREATE] ${lang} → ${normNs}.${normKey}`);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: "✅ Importación completada correctamente",
      updated,
      created,
      logs: logs.slice(0, 20), // solo mostrar los primeros 20 cambios
    });
  } catch (e: any) {
    console.error("❌ Error en importación CSV:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Error interno en importación" },
      { status: 500 }
    );
  }
}