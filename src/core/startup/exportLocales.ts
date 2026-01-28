import fs from "fs";
import path from "path";
import { prisma } from "@/core/prisma";

/**
 * 🌍 exportLocales()
 * ---------------------------------------------------------
 * Extrae todas las traducciones de la base de datos
 * (por systemId o tenantId) y genera archivos JSON por idioma.
 *
 * Ejemplo:
 *   pnpm tsx apps/rowi/src/core/startup/exportLocales.ts
 */
async function exportLocales() {
  console.log("🌍 ===== EXPORTADOR DE LOCALES DESDE LA BD =====");

  // Buscar el sistema activo
  const system = await prisma.system.findFirst();
  if (!system) {
    console.error("❌ No se encontró System activo. Ejecuta ensureSystemBootstrap primero.");
    process.exit(1);
  }

  console.log(`🧭 Exportando desde System: ${system.name}`);

  // Cargar todas las traducciones del sistema o globales
  const translations = await prisma.translation.findMany({
    where: {
      OR: [{ systemId: system.id }, { systemId: null }],
    },
    orderBy: [{ ns: "asc" }, { key: "asc" }],
  });

  if (!translations.length) {
    console.warn("⚠️ No se encontraron traducciones en la base de datos.");
    process.exit(0);
  }

  // Agrupar por idioma y namespace
  const grouped: Record<string, Record<string, string>> = {};
  for (const t of translations) {
    const lang = t.lang || "es";
    if (!grouped[lang]) grouped[lang] = {};
    grouped[lang][`${t.ns}.${t.key}`] = t.value;
  }

  const outDir = path.resolve("src/lib/i18n/locales");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log(`📁 Carpeta destino: ${outDir}`);

  // Guardar cada idioma en su archivo correspondiente
  for (const lang of Object.keys(grouped)) {
    const content = grouped[lang];
    const total = Object.keys(content).length;
    const outPath = path.join(outDir, `${lang}.json`);
    fs.writeFileSync(outPath, JSON.stringify(content, null, 2), "utf8");

    // Contar namespaces
    const namespaces = new Set(Object.keys(content).map((k) => k.split(".")[0]));
    console.log(
      `✅ ${lang}.json → ${total} claves (${namespaces.size} namespaces)`
    );
  }

  console.log("✨ Exportación completada correctamente.");
  await prisma.$disconnect();
  process.exit(0);
}

// Ejecutar directamente
exportLocales().catch(async (err) => {
  console.error("❌ Error exportando traducciones:", err);
  await prisma.$disconnect();
  process.exit(1);
});