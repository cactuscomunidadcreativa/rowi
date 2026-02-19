import OpenAI from "openai";
import { buildCommunityPrompt } from "./prompts/community";

const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const AffinityCommunityAgent = {
  name: "Rowi Community Coach",
  model: "gpt-4o-mini",
  color: "#a2d2ff",

  /**
   * 🧩 Ejecuta análisis de clima grupal
   * - Usa datos del summary global (promedio, contextos)
   * - Devuelve texto interpretativo con tono coach organizacional
   */
  async run({ locale = "es", tenantId = "six-seconds-global", payload = {} }) {
    try {
      const prompt = buildCommunityPrompt({ locale, payload });
      const completion = await ai.chat.completions.create({
        model: this.model,
        temperature: 0.6,
        max_tokens: 280,
        messages: [
          {
            role: "system",
            content: `Eres Rowi, un coach de clima emocional grupal. 
Responde solo en ${locale}, con tono empático, inspirador y breve.`,
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
      console.error("[AffinityCommunityAgent] error:", e);
      return {
        answer: "Error generando análisis de comunidad.",
        tokens: null,
        costUsd: 0,
      };
    }
  },
};