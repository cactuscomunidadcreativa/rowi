import { prisma } from "@/lib/db";
import OpenAI from "openai";
import { cosineSimilarity } from "scikit-similarity"; // si no tienes este helper, te lo agrego abajo

// ==================== CONFIG ====================
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SIMILARITY_THRESHOLD = 0.85; // Ajusta: 0.80 = más agresivo, 0.90 = más conservador
const DRY_RUN = true; // ⚠️ Si está en true, solo imprime sugerencias, no modifica la BD
// =================================================

(async () => {
  try {
    console.log("🌍 Unificando traducciones con IA semántica...");
    const translations = await prisma.translation.findMany();

    // Agrupar por namespace
    const grouped = new Map<string, typeof translations>();
    for (const t of translations) {
      if (!grouped.has(t.ns)) grouped.set(t.ns, []);
      grouped.get(t.ns)!.push(t);
    }

    let merges = 0;
    for (const [ns, list] of grouped.entries()) {
      const uniqueValues = Array.from(new Set(list.map((l) => l.value).filter(Boolean)));

      if (uniqueValues.length < 2) continue;

      // Obtener embeddings de todos los textos
      const embeddings = await client.embeddings.create({
        model: "text-embedding-3-small",
        input: uniqueValues,
      });

      const vectors = embeddings.data.map((d) => d.embedding);

      // Comparar todos contra todos
      for (let i = 0; i < uniqueValues.length; i++) {
        for (let j = i + 1; j < uniqueValues.length; j++) {
          const sim = cosineSimilarity(vectors[i], vectors[j]);
          if (sim > SIMILARITY_THRESHOLD) {
            console.log(`🔗 ${ns}: "${uniqueValues[i]}" ≈ "${uniqueValues[j]}" (${sim.toFixed(2)})`);

            if (!DRY_RUN) {
              const group = list.filter(
                (t) => [uniqueValues[i], uniqueValues[j]].includes(t.value)
              );

              // Crear clave unificada
              const keyBase = uniqueValues[i]
                .toLowerCase()
                .replace(/\s+/g, "_")
                .replace(/[^a-zA-Z0-9_]/g, "")
                .slice(0, 40);

              const key = `${ns}_${keyBase}`;
              const mergedLangs = ["es", "en", "pt", "it"];

              await prisma.translation.deleteMany({
                where: { id: { in: group.map((g) => g.id) } },
              });

              await prisma.translation.createMany({
                data: mergedLangs.map((lang) => ({
                  ns,
                  key,
                  lang,
                  value:
                    group.find((g) => g.lang === lang)?.value ||
                    group.find((g) => g.lang !== lang)?.value ||
                    "",
                })),
              });

              merges++;
            }
          }
        }
      }
    }

    console.log(DRY_RUN
      ? "🧪 Modo simulación: sin modificar BD."
      : `✅ ${merges} grupos de traducciones unificadas.`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error en unificación semántica:", err);
    process.exit(1);
  }
})();

// =================================================
// Si no tienes un helper de similitud coseno, agrega esto:
export function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
}