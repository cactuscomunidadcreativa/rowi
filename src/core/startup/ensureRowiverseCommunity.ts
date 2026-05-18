import { prisma } from "@/core/prisma";

export async function ensureRowiverseCommunity() {
  console.log("🌍 Generando Rowiverse Community...");

  // Crear tenant principal
  const rowi = await prisma.tenant.upsert({
    where: { slug: "six-seconds-global" },
    update: {},
    create: {
      name: "Rowiverse",
      slug: "six-seconds-global",
    }
  });

  // Crear traducciones mínimas para arranque. Schema renamed
  // `locale` → `lang` and `text` → `value`.
  const translations = [
    { ns: "common", key: "hello", lang: "es", value: "Hola", tenantId: rowi.id },
    { ns: "common", key: "hello", lang: "en", value: "Hello", tenantId: rowi.id },
    { ns: "dashboard", key: "welcome", lang: "es", value: "Bienvenido al Hub", tenantId: rowi.id },
    { ns: "dashboard", key: "welcome", lang: "en", value: "Welcome to the Hub", tenantId: rowi.id },
  ];

  // Translation schema: unique [tenantId, ns, key, lang]. Compound unique
  // name follows the order — tenantId_ns_key_lang. Field is `lang` (not
  // locale) and `value` (not text).
  for (const t of translations) {
    await prisma.translation.upsert({
      where: {
        tenantId_ns_key_lang: {
          tenantId: t.tenantId,
          ns: t.ns,
          key: t.key,
          lang: t.lang,
        },
      },
      update: { value: t.value },
      create: t,
    });
  }

  console.log("✅ Rowiverse seed completado correctamente.");
}