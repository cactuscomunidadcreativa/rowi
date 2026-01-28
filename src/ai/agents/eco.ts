// src/ai/agents/eco.ts
import OpenAI from "openai";
import { registerUsage } from "../client/registerUsage";
import { buildMessagesECO } from "../prompts/modules/eco";
import { getAgentConfig, buildCultureEnrichedPrompt } from "./getAgentConfig";

const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const EcoAgent = {
  id: "eco",
  name: "Rowi ECO",
  color: "#6bc3b0",
  model: "gpt-4o-mini",

  async run({
    ask = "",
    locale = "es",
    language = "Español",
    tenantId = "rowi-master",
  }: {
    ask?: string;
    locale?: string;
    language?: string;
    tenantId?: string;
  }) {
    try {
      /* 🏢 0. Cargar cultura corporativa del tenant */
      const agentConfig = await getAgentConfig("eco", tenantId);

      /* =========================================================
         🧠 1. Contexto del sistema — Comunicación emocional (ECO)
         ⚠️ Este prompt se mantiene aquí y se puede seguir editando
      ========================================================= */
      const basePrompt = `
Eres Rowi, un experto en comunicación emocional (ECO).
Tu misión es ayudar a redactar mensajes con inteligencia emocional.
Responde siempre en ${language}. Mantén tono humano, cálido y profesional.
Usa máximo 5 líneas.`;

      // Agregar cultura corporativa del tenant (si existe) SIN modificar el prompt base
      const system = buildCultureEnrichedPrompt(basePrompt, agentConfig, language);

      /* =========================================================
         🚀 2. Llamado a OpenAI con cultura corporativa
      ========================================================= */
      const completion = await ai.chat.completions.create({
        model: agentConfig?.model || this.model,
        temperature: 0.7,
        max_tokens: 220,
        messages: [
          { role: "system", content: system },
          { role: "user", content: ask || "Ayúdame a redactar un mensaje emocional." },
        ],
      });

      const text =
        completion.choices[0]?.message?.content?.trim() ??
        "✉️ No tengo un mensaje ahora.";

      /* =========================================================
         📊 3. Registro del uso IA (tokens y costo)
      ========================================================= */
      const tokensInput = completion.usage?.prompt_tokens || 0;
      const tokensOutput = completion.usage?.completion_tokens || 0;
      const costUsd = ((tokensInput + tokensOutput) / 1000) * 0.002;

      await registerUsage({
        tenantId,
        feature: "ECO",
        model: this.model,
        tokensInput,
        tokensOutput,
        costUsd,
      });

      /* =========================================================
         💬 4. Respuesta final
      ========================================================= */
      return text;
    } catch (e: any) {
      console.error("[EcoAgent] error:", e);
      return (
        e?.message ||
        {
          es: "Error procesando comunicación.",
          en: "Error processing communication.",
          pt: "Erro ao processar comunicação.",
          it: "Errore durante l'elaborazione della comunicazione.",
        }[locale]
      );
    }
  },
};