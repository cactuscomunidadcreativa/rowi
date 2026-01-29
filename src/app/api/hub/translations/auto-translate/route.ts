import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max for large translations

/**
 * 🌐 POST /api/hub/translations/auto-translate
 * ---------------------------------------------------------
 * Traduce automáticamente todas las claves de un idioma a otro
 * usando OpenAI (GPT-4).
 *
 * Body: {
 *   sourceLang: "es",
 *   targetLang: "pt",
 *   translations: { "key1": "valor1", "key2": "valor2", ... }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { sourceLang, targetLang, translations } = await req.json();

    if (!sourceLang || !targetLang || !translations) {
      return NextResponse.json(
        { error: "Faltan parámetros: sourceLang, targetLang, translations" },
        { status: 400 }
      );
    }

    const keys = Object.keys(translations);
    if (keys.length === 0) {
      return NextResponse.json({ translations: {} });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY no configurada" },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });

    // Nombres de idiomas para mejor contexto
    const langNames: Record<string, string> = {
      es: "Spanish",
      en: "English",
      pt: "Portuguese",
      fr: "French",
      de: "German",
      it: "Italian",
      zh: "Chinese",
      ja: "Japanese",
      ko: "Korean",
      ar: "Arabic",
    };

    const sourceLangName = langNames[sourceLang] || sourceLang;
    const targetLangName = langNames[targetLang] || targetLang;

    // Dividir en chunks para evitar límites de contexto
    const CHUNK_SIZE = 100;
    const chunks: Record<string, string>[] = [];

    for (let i = 0; i < keys.length; i += CHUNK_SIZE) {
      const chunkKeys = keys.slice(i, i + CHUNK_SIZE);
      const chunk: Record<string, string> = {};
      for (const key of chunkKeys) {
        chunk[key] = translations[key];
      }
      chunks.push(chunk);
    }

    const translatedResult: Record<string, string> = {};

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`📝 Translating chunk ${i + 1}/${chunks.length} (${Object.keys(chunk).length} keys)`);

      const prompt = `You are a professional translator. Translate the following JSON object from ${sourceLangName} to ${targetLangName}.

IMPORTANT RULES:
1. Maintain the exact same JSON structure and keys
2. Only translate the VALUES, never the keys
3. Keep any placeholders like {{name}}, {count}, etc. exactly as they are
4. Preserve HTML tags if present
5. Keep the tone and style consistent with a modern web application UI
6. For technical terms, use the commonly accepted translation in ${targetLangName}
7. Return ONLY valid JSON, no explanations

Input JSON:
${JSON.stringify(chunk, null, 2)}

Output the translated JSON:`;

      const response = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 8000,
        messages: [
          { role: "system", content: "You are a professional translator. Output only valid JSON." },
          { role: "user", content: prompt }
        ],
      });

      // Extract text content
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      // Parse the JSON response
      let translatedChunk: Record<string, string>;
      try {
        // Try to extract JSON from the response (in case there's extra text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          translatedChunk = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("Failed to parse translation response:", content);
        throw new Error("Error al parsear la respuesta de traducción");
      }

      // Merge into result
      Object.assign(translatedResult, translatedChunk);
    }

    console.log(`✅ Translation complete: ${Object.keys(translatedResult).length} keys`);

    return NextResponse.json({
      ok: true,
      translations: translatedResult,
      count: Object.keys(translatedResult).length,
    });
  } catch (e: any) {
    console.error("❌ Error POST /hub/translations/auto-translate:", e);
    return NextResponse.json(
      { error: e.message || "Error al traducir" },
      { status: 500 }
    );
  }
}
