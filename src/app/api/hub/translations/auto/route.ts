import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";
import { translateText } from "@/lib/google/translate";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const { keys, lang } = await req.json();
    if (!Array.isArray(keys) || !lang) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    // 🌍 Buscar el System raíz
    const system = await prisma.system.findFirst();
    if (!system) {
      return NextResponse.json({ error: "System raíz no encontrado" }, { status: 500 });
    }

    // 🔹 Dividir en lotes de 10 (traducciones paralelas controladas)
    const batchSize = 10;
    const translations: { ns: string; key: string; value: string }[] = [];

    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(async ({ ns, key, value }) => {
          const namespace = ns || "common";
          const baseText = value || key;
          const translated = await translateText(baseText, lang);

          // Guardar o actualizar en BD
          const existing = await prisma.translation.findFirst({
            where: {
              tenantId: null,
              ns: namespace,
              key,
              lang,
            },
          });

          if (existing) {
            await prisma.translation.update({
              where: { id: existing.id },
              data: { value: translated, updatedAt: new Date() },
            });
          } else {
            await prisma.translation.create({
              data: {
                tenantId: null,
                systemId: system.id,
                ns: namespace,
                key,
                value: translated,
                lang,
              },
            });
          }

          return { ns: namespace, key, value: translated };
        })
      );

      // Agregar solo las que se tradujeron con éxito
      results.forEach((r) => {
        if (r.status === "fulfilled" && r.value) translations.push(r.value);
      });
    }

    // ✅ Enviar al front las nuevas traducciones
    return NextResponse.json({
      ok: true,
      count: translations.length,
      translations,
    });
  } catch (err: any) {
    console.error("❌ Error /api/hub/translations/auto:", err);
    return NextResponse.json(
      { error: err.message || "Error procesando traducciones automáticas" },
      { status: 500 }
    );
  }
}