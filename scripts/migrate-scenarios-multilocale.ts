/**
 * Migración one-time: ScenarioBank mono-idioma → multi-idioma.
 *
 * 1. Fusiona los 3 escenarios "cliente molesto por retraso" (es/en/zh), que son
 *    el MISMO escenario en idiomas distintos, en UNA fila con translations.
 * 2. Backfill: cualquier fila sin `translations` recibe su versión base
 *    (derivada de sus campos title/summary/brief + locale/baseLocale).
 *
 * Idempotente: si ya está migrado (fila base con las 3 traducciones), no hace
 * nada. Las sesiones ya jugadas apuntan por scenarioId; al borrar duplicados se
 * repuntan a la fila fusionada para no romper PracticeSession.
 *
 * Ejecutar: `tsx scripts/migrate-scenarios-multilocale.ts`
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Los 3 títulos que son el MISMO escenario "cliente molesto por retraso".
const CLIENTE_MOLESTO = {
  es: "Cliente molesto por un retraso",
  en: "Upset customer over a delay",
  zh: "因延误而不满的客户",
};

async function fuseClienteMolesto() {
  const rows = await prisma.scenarioBank.findMany({
    where: { title: { in: [CLIENTE_MOLESTO.es, CLIENTE_MOLESTO.en, CLIENTE_MOLESTO.zh] } },
    orderBy: { createdAt: "asc" },
  });
  if (rows.length <= 1) return; // ya fusionado o no existe

  // Elegir la fila canónica: la española (base es) si existe, si no la primera.
  const canonical = rows.find((r) => r.title === CLIENTE_MOLESTO.es) ?? rows[0];
  const others = rows.filter((r) => r.id !== canonical.id);

  // Componer translations desde cada fila.
  const translations: Record<string, { title: string; summary: string | null; brief: string }> = {};
  for (const r of rows) {
    const loc = r.locale || r.baseLocale || "es";
    translations[loc] = { title: r.title, summary: r.summary, brief: r.brief };
  }

  await prisma.scenarioBank.update({
    where: { id: canonical.id },
    data: {
      baseLocale: "es",
      locale: "es",
      title: CLIENTE_MOLESTO.es,
      translations,
    },
  });

  // Repuntar sesiones de los duplicados a la fila canónica antes de borrarlos.
  for (const o of others) {
    await prisma.practiceSession.updateMany({
      where: { scenarioId: o.id },
      data: { scenarioId: canonical.id },
    });
    await prisma.scenarioBank.delete({ where: { id: o.id } });
  }
  console.log(`[migrate] fusionado "cliente molesto": ${rows.length} filas → 1 (id=${canonical.id})`);
}

function hasAnyTranslation(t: unknown): boolean {
  if (!t || typeof t !== "object") return false;
  return Object.values(t as Record<string, unknown>).some(
    (v) => v && typeof v === "object" && typeof (v as { title?: unknown }).title === "string",
  );
}

async function backfillTranslations() {
  const rows = await prisma.scenarioBank.findMany();
  let n = 0;
  for (const r of rows) {
    if (hasAnyTranslation(r.translations)) continue; // ya tiene
    const loc = r.locale || r.baseLocale || "es";
    await prisma.scenarioBank.update({
      where: { id: r.id },
      data: {
        baseLocale: loc,
        translations: { [loc]: { title: r.title, summary: r.summary, brief: r.brief } },
      },
    });
    n++;
  }
  console.log(`[migrate] backfill translations en ${n} filas`);
}

async function main() {
  await fuseClienteMolesto();
  await backfillTranslations();
  console.log("[migrate] done");
}

main()
  .catch((e) => {
    console.error("[migrate] failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
