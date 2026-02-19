import OpenAI from "openai";
import { buildTeamworkPrompt } from "./prompts/teamwork";

const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const AffinityTeamworkAgent = {
  name: "Rowi Teamwork Coach",
  model: "gpt-4o-mini",
  color: "#7dd3fc", // azul colaborativo

  /**
   * 🤝 Analiza el nivel de afinidad, colaboración y confianza en equipos
   * - Usa resumen global o métricas de grupo
   */
  async run({ locale = "es", tenantId = "six-seconds-global", payload = {} }) {
    try {
      const prompt = buildTeamworkPrompt({ locale, data: payload });

      const completion = await ai.chat.completions.create({
        model: this.model,
        temperature: 0.6,
        max_tokens: 260,
        messages: [
          {
            role: "system",
            content: `Eres Rowi, un coach especializado en trabajo en equipo y colaboración.
Responde solo en ${locale}, usando lenguaje positivo y orientado a acción.`,
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
      console.error("[AffinityTeamworkAgent] error:", e);
      return {
        answer: "Error generando análisis de equipo.",
        tokens: null,
        costUsd: 0,
      };
    }
  },
};