/* =========================================================
   ⚙️ AFFINITY UTILS (capa de servidor)
   ---------------------------------------------------------
   La lógica pura del motor (matrices, pesos, fórmulas) vive en
   `@/domains/affinity/lib/affinityEngine` — fuente ÚNICA de verdad.
   Aquí solo se RE-EXPORTA ese núcleo y se añade lo que requiere
   servidor: Prisma (learnUserPrefs) y OpenAI (generateAiAdvice).

   Las rutas /api/affinity/* siguen importando de "../utils" sin
   cambios: este archivo mantiene la misma superficie pública.
========================================================= */

import { prisma } from "@/core/prisma";
import OpenAI from "openai";

// Re-export del núcleo puro: tipos, pesos, fórmulas y utilidades.
export {
  type Project,
  type CompKey,
  CTX,
  COMP_WEIGHTS,
  SUB_WEIGHTS,
  TALENT_WEIGHTS,
  N,
  clamp,
  avg,
  stddev,
  to100,
  seiLevel135,
  normalizeProject,
  normCloseness,
  closenessMultiplier,
  collScoreBBP,
  compAffinity135,
  understanding135,
  talentSynergyFactor,
  collaboration135,
  inferMemberChannel,
} from "@/domains/affinity/lib/affinityEngine";

/* =========================================================
   🔎 Preferencias de usuario aprendidas del historial de chat
   (requiere Prisma — capa servidor)
========================================================= */
export async function learnUserPrefs(userId: string) {
  const chats = await prisma.rowiChat.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const text = chats.map((c) => c.content).join(" ");
  const numbers = (text.match(/\d[\d\.\,]*/g) || []).length;
  const whys = (text.match(/\b(por qué|porque|why|how)\b/gi) || []).length;
  const numericBias = numbers > whys * 1.5 ? 1.08 : 1.0;
  const narrativeBias = whys > numbers * 1.3 ? 1.06 : 1.0;
  const directTone = /\b(haz|define|prioriza|lista|resume|pasos|plan)\b/i.test(text) ? 1.05 : 1.0;
  const detail = text.length > 1500 ? 1.05 : text.length < 300 ? 0.98 : 1.0;
  return {
    commStyle: (numericBias > 1.0 ? "numeric" : narrativeBias > 1.0 ? "narrative" : "balanced") as
      | "numeric"
      | "narrative"
      | "balanced",
    toneFactor: directTone,
    detailFactor: detail,
    biasFactor: Math.max(numericBias, narrativeBias) * directTone * detail,
  };
}

/* =========================================================
   🤖 IA contextual (requiere OpenAI — capa servidor)
========================================================= */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export async function generateAiAdvice({
  locale,
  aName,
  bName,
  context,
}: {
  locale: string;
  aName: string;
  bName: string;
  context: string;
}) {
  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      max_tokens: 400,
      messages: [
        { role: "system", content: "Eres Rowi, analista de afinidad emocional." },
        { role: "user", content: `Analiza la relación entre ${aName} y ${bName} en ${context}.` },
      ],
    });
    return resp.choices?.[0]?.message?.content?.trim() || "";
  } catch (e) {
    console.error("AI error:", e);
    return "";
  }
}
