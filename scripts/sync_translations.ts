import { prisma } from "@/core/prisma";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

async function main() {
  console.log("🌍 Sincronizando traducciones desde CSV...");

  const filePath = path.resolve(process.cwd(), "translations-global.csv"); // cambia si usas otro nombre
  if (!fs.existsSync(filePath)) throw new Error("Archivo CSV no encontrado");

  const csv = fs.readFileSync(filePath, "utf8");
  const records = parse(csv, { columns: true, skip_empty_lines: true });

  let created = 0;
  let updated = 0;

  for (const row of records) {
    const ns = row.Namespace?.trim();
    const key = row.Key?.trim();
    const es = row.ES?.trim();
    if (!ns || !key) continue;

    const langs = ["es", "en", "pt", "it"];
    for (const lang of langs) {
      const value =
        lang === "es"
          ? es || ""
          : row[lang.toUpperCase()]?.trim() || "";

      const existing = await prisma.translation.findFirst({
        where: { ns, key, lang },
      });

      if (existing) {
        if (existing.value !== value) {
          await prisma.translation.update({
            where: { id: existing.id },
            data: { value },
          });
          updated++;
        }
      } else {
        await prisma.translation.create({
          data: { ns, key, lang, value },
        });
        created++;
      }
    }
  }

  console.log(`✅ Creaciones: ${created} | Actualizaciones: ${updated}`);
}

main()
  .catch((err) => {
    console.error("❌ Error sincronizando traducciones:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });