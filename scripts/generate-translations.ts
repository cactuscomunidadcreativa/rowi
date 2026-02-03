// scripts/generate-translations.ts
// Genera traducciones completas para PT (Brasil) e IT usando OpenAI

import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const CHUNK_SIZE = 80; // Traducciones por request

async function translateChunk(
  client: OpenAI,
  translations: Record<string, string>,
  sourceLang: string,
  targetLang: string
): Promise<Record<string, string>> {
  const langNames: Record<string, string> = {
    es: "Spanish",
    en: "English",
    pt: "Brazilian Portuguese",  // Portugués de Brasil específicamente
    it: "Italian",
  };

  const sourceLangName = langNames[sourceLang] || sourceLang;
  const targetLangName = langNames[targetLang] || targetLang;

  const prompt = `You are a professional translator specializing in software localization. Translate the following JSON object from ${sourceLangName} to ${targetLangName}.

IMPORTANT RULES:
1. Maintain the exact same JSON structure and keys
2. Only translate the VALUES, never the keys
3. Keep any placeholders like {{name}}, {count}, %s, etc. exactly as they are
4. Preserve HTML tags if present
5. Keep the tone and style consistent with a modern web application UI
6. Use formal "você" for Brazilian Portuguese (not "tu")
7. For technical terms, use the commonly accepted translation in ${targetLangName}
8. Return ONLY valid JSON, no explanations or markdown

Input JSON:
${JSON.stringify(translations, null, 2)}

Output the translated JSON:`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 16000,
    temperature: 0.3,
    messages: [
      { role: "system", content: "You are a professional software translator. Output only valid JSON without markdown code blocks." },
      { role: "user", content: prompt }
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  // Limpiar la respuesta de posibles bloques de código markdown
  let cleanContent = content.trim();
  if (cleanContent.startsWith("```json")) {
    cleanContent = cleanContent.slice(7);
  }
  if (cleanContent.startsWith("```")) {
    cleanContent = cleanContent.slice(3);
  }
  if (cleanContent.endsWith("```")) {
    cleanContent = cleanContent.slice(0, -3);
  }

  const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error("No JSON found in response");
}

async function main() {
  console.log("🌐 Generando traducciones completas para PT (Brasil) e IT...\n");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY no configurada");
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });

  // Cargar traducciones de ES
  const esPath = path.join(__dirname, "../src/lib/i18n/locales/es.json");
  const esTranslations = JSON.parse(fs.readFileSync(esPath, "utf-8"));
  const keys = Object.keys(esTranslations);

  console.log(`📝 Total de claves a traducir: ${keys.length}`);

  // Obtener el systemId
  const system = await prisma.system.findFirst({ where: { slug: "rowi-global" } });
  if (!system) {
    console.error("❌ No se encontró el sistema");
    process.exit(1);
  }

  const targetLangs = ["pt", "it"];

  for (const targetLang of targetLangs) {
    const langLabel = targetLang === "pt" ? "PT (Brasil)" : "IT (Italiano)";
    console.log(`\n${"=".repeat(50)}`);
    console.log(`🔄 Traduciendo TODAS las claves a ${langLabel}...`);
    console.log(`${"=".repeat(50)}`);

    const allTranslated: Record<string, string> = {};

    // Dividir TODAS las claves en chunks (sin considerar existentes)
    const chunks: string[][] = [];
    for (let i = 0; i < keys.length; i += CHUNK_SIZE) {
      chunks.push(keys.slice(i, i + CHUNK_SIZE));
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunkKeys = chunks[i];
      const chunkData: Record<string, string> = {};
      for (const key of chunkKeys) {
        chunkData[key] = esTranslations[key];
      }

      process.stdout.write(`   📝 Chunk ${i + 1}/${chunks.length} (${chunkKeys.length} claves)... `);

      try {
        const translated = await translateChunk(client, chunkData, "es", targetLang);
        Object.assign(allTranslated, translated);
        successCount += chunkKeys.length;
        console.log("✅");

        // Pequeña pausa para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error: any) {
        console.log(`❌ ${error.message}`);
        errorCount += chunkKeys.length;
        // En caso de error, usar las traducciones originales en español
        Object.assign(allTranslated, chunkData);
      }
    }

    console.log(`\n   📊 Traducidas: ${successCount}, Errores: ${errorCount}`);

    // Guardar archivo local
    const outputPath = path.join(__dirname, `../src/lib/i18n/locales/${targetLang}.json`);
    const sortedTranslations: Record<string, string> = {};
    Object.keys(allTranslated).sort().forEach(key => {
      sortedTranslations[key] = allTranslated[key];
    });

    fs.writeFileSync(outputPath, JSON.stringify(sortedTranslations, null, 2));
    console.log(`   💾 Guardado en ${outputPath}`);

    // Insertar en base de datos
    console.log(`   🗄️ Insertando ${Object.keys(sortedTranslations).length} traducciones en base de datos...`);
    let dbCount = 0;
    for (const [key, value] of Object.entries(sortedTranslations)) {
      const ns = key.split(".")[0];
      await prisma.translation.upsert({
        where: { id: `trans-${targetLang}-${key.replace(/\./g, "-")}` },
        update: { value: value as string },
        create: {
          id: `trans-${targetLang}-${key.replace(/\./g, "-")}`,
          ns,
          key,
          value: value as string,
          lang: targetLang,
          systemId: system.id,
        },
      });
      dbCount++;
      if (dbCount % 500 === 0) {
        process.stdout.write(`${dbCount}... `);
      }
    }
    console.log(`\n   ✅ ${dbCount} traducciones insertadas en DB para ${langLabel}`);
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ PROCESO COMPLETADO!");
  console.log("=".repeat(50));

  // Verificar conteos finales
  const counts = await prisma.translation.groupBy({
    by: ['lang'],
    _count: { lang: true }
  });
  console.log("\n📊 Traducciones en DB:");
  for (const c of counts) {
    console.log(`   ${c.lang.toUpperCase()}: ${c._count.lang}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
