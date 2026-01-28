#!/usr/bin/env node
// 🧠 Inserta las claves faltantes de navegación (ui.nav.*) en la tabla Translation

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const keys = [
  { ns: "ui", key: "nav.dashboard", es: "Dashboard", en: "Dashboard", pt: "Painel", it: "Dashboard" },
  { ns: "ui", key: "nav.community", es: "Comunidad", en: "Community", pt: "Comunidade", it: "Comunità" },
  { ns: "ui", key: "nav.affinity", es: "Afinidad", en: "Affinity", pt: "Afinidade", it: "Affinità" },
  { ns: "ui", key: "nav.eco", es: "Eco", en: "Eco", pt: "Eco", it: "Eco" },
  { ns: "ui", key: "nav.rowicoach", es: "Coach", en: "Coach", pt: "Treinador", it: "Allenatore" },
];

async function main() {
  console.log("🚀 Corrigiendo traducciones faltantes de navegación...");

  // Detecta el systemId principal
  const system = await prisma.system.findFirst();
  const systemId = system?.id || null;
  console.log(`🌎 Usando systemId: ${systemId || "NULL (global)"}`);

  for (const k of keys) {
    for (const [lang, value] of Object.entries(k)) {
      if (["es", "en", "pt", "it"].includes(lang)) {
        await prisma.translation.upsert({
          where: {
            systemId_ns_key_lang: {
              systemId,
              ns: k.ns,
              key: k.key,
              lang,
            },
          },
          update: { value },
          create: {
            systemId,
            ns: k.ns,
            key: k.key,
            lang,
            value,
          },
        });
        console.log(`✅ ${k.ns}.${k.key} (${lang}) → ${value}`);
      }
    }
  }

  await prisma.$disconnect();
  console.log("\n🎯 Traducciones insertadas o actualizadas correctamente.");
}

main().catch((e) => {
  console.error("❌ Error al insertar traducciones:", e);
  process.exit(1);
});