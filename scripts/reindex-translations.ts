// scripts/reindex-translations.ts
import { prisma } from "@/core/prisma";

(async () => {
  console.log("🔍 Reindexando traducciones...");

  const all = await prisma.translation.findMany();
  let created = 0;

  for (const t of all) {
    // Ignora si ya está normalizada
    if (!t.key.includes("__") && !t.key.includes("page_")) continue;

    // Limpia el namespace
    const newNs =
      ["[id]", "[slug]", "[token]"].includes(t.ns) ? "pages" : t.ns.replace(/[\[\]]/g, "");

    // Limpia el nombre de key (quita page__, page_, etc.)
    const newKey = t.key
      .replace(/^page[_]+/, "")
      .replace(/^page__+/, "")
      .replace(/_+/g, "_")
      .trim();

    // Evita duplicados exactos
    const exists = await prisma.translation.findFirst({
      where: { ns: newNs, key: newKey, lang: t.lang },
    });
    if (exists) continue;

    // Crea la nueva versión limpia
    await prisma.translation.create({
      data: {
        ns: newNs,
        key: newKey,
        lang: t.lang,
        value: t.value,
        tenantId: t.tenantId,
        systemId: t.systemId,
      },
    });
    created++;
  }

  console.log(`✅ Reindexación completa: ${created} nuevas traducciones creadas.`);
  process.exit(0);
})();