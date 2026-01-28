import fs from "fs";
import path from "path";
import { prisma } from "@/core/prisma";

async function exportLocales() {
  console.log("🌍 Exportando traducciones desde la base de datos...");

  const translations = await prisma.translation.findMany({
    where: { systemId: { not: null } },
    orderBy: [{ ns: "asc" }, { key: "asc" }],
  });

  const grouped: Record<string, Record<string, string>> = {
    es: {},
    en: {},
    pt: {},
    it: {},
  };

  for (const t of translations) {
    const lang = (t.lang || "es") as "es" | "en" | "pt" | "it";
    grouped[lang][`${t.ns}.${t.key}`] = t.value;
  }

  const outDir = path.resolve("src/lib/i18n/locales");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const lang of Object.keys(grouped)) {
    const outPath = path.join(outDir, `${lang}.json`);
    fs.writeFileSync(outPath, JSON.stringify(grouped[lang], null, 2), "utf8");
    console.log(`✅ ${lang}.json actualizado (${Object.keys(grouped[lang]).length} claves)`);
  }

  console.log("✨ Exportación completada.");
  process.exit(0);
}

exportLocales().catch((err) => {
  console.error("❌ Error exportando traducciones:", err);
  process.exit(1);
});