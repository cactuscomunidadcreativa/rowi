import OpenAI from "openai";
import { buildRelationshipPrompt } from "./prompts/relationship";

const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const AffinityRelationshipAgent = {
  name: "Rowi Relationship Coach",
  model: "gpt-4o-mini",
  color: "#f9a8d4",

  /**
   * ❤️ Analiza afinidad emocional entre dos personas
   * - Basado en el summary o afinidad directa
   */
  async run({ locale = "es", tenantId = "rowi-master", payload = {} }) {
    try {
      const prompt = buildRelationshipPrompt({ locale, payload });
      const completion = await ai.chat.completions.create({
        model: this.model,
        temperature: 0.65,
        max_tokens: 220,
        messages: [
          {
            role: "system",
            content: `Eres Rowi, un coach de relaciones y afinidad emocional. 
Responde solo en ${locale}, con calidez y claridad.`,
          },
          { role: "user", content: prompt },
        ],
      });

      const answer = completion.choices?.[0]?.message?.content?.trim() || "";
      return {
        answer,
        tokens: completion.usage || null,
        costUsd: ((completion.usage?.total_tokens || 0) / 1000) * 0.002,
      };
    } catch (e: any) {
      console.error("[AffinityRelationshipAgent] error:", e);
      return { answer: "Error generando análisis de relación.", tokens: null, costUsd: 0 };
    }
  },
};