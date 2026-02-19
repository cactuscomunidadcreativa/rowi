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

  // Crear traducciones mínimas para arranque
  const translations = [
    { ns: "common", key: "hello", locale: "es", text: "Hola", tenantId: rowi.id },
    { ns: "common", key: "hello", locale: "en", text: "Hello", tenantId: rowi.id },
    { ns: "dashboard", key: "welcome", locale: "es", text: "Bienvenido al Hub", tenantId: rowi.id },
    { ns: "dashboard", key: "welcome", locale: "en", text: "Welcome to the Hub", tenantId: rowi.id },
  ];

  for (const t of translations) {
    await prisma.translation.upsert({
      where: {
        ns_key_locale_tenantId: {
          ns: t.ns,
          key: t.key,
          locale: t.locale,
          tenantId: t.tenantId
        }
      },
      update: { text: t.text },
      create: t,
    });
  }

  console.log("✅ Rowiverse seed completado correctamente.");
}