// scripts/seed-translations-pt-it.ts
// Inserta las traducciones de PT e IT en la base de datos

import { PrismaClient } from "@prisma/client";
import ptTranslations from "../src/lib/i18n/locales/pt.json";
import itTranslations from "../src/lib/i18n/locales/it.json";

const prisma = new PrismaClient();

async function main() {
  console.log("🌐 Seeding PT and IT translations...\n");

  // Primero obtener el systemId de producción
  const system = await prisma.system.findFirst({ where: { slug: "rowi-global" } });

  if (!system) {
    console.error("❌ No se encontró el sistema 'rowi-global'. Ejecuta primero el seed principal.");
    process.exit(1);
  }

  const systemId = system.id;
  console.log(`📌 System ID: ${systemId}\n`);

  // Insertar traducciones de PT
  console.log("🇧🇷 Insertando traducciones de Portugués...");
  let ptCount = 0;
  for (const [key, value] of Object.entries(ptTranslations)) {
    const ns = key.split(".")[0];
    await prisma.translation.upsert({
      where: { id: `trans-pt-${key.replace(/\./g, "-")}` },
      update: { value: value as string },
      create: {
        id: `trans-pt-${key.replace(/\./g, "-")}`,
        ns,
        key,
        value: value as string,
        lang: "pt",
        systemId,
      },
    });
    ptCount++;
  }
  console.log(`   ✅ ${ptCount} traducciones PT insertadas`);

  // Insertar traducciones de IT
  console.log("🇮🇹 Insertando traducciones de Italiano...");
  let itCount = 0;
  for (const [key, value] of Object.entries(itTranslations)) {
    const ns = key.split(".")[0];
    await prisma.translation.upsert({
      where: { id: `trans-it-${key.replace(/\./g, "-")}` },
      update: { value: value as string },
      create: {
        id: `trans-it-${key.replace(/\./g, "-")}`,
        ns,
        key,
        value: value as string,
        lang: "it",
        systemId,
      },
    });
    itCount++;
  }
  console.log(`   ✅ ${itCount} traducciones IT insertadas`);

  console.log("\n✅ Seed de traducciones completado!");
  console.log(`   Total: ${ptCount + itCount} traducciones`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
