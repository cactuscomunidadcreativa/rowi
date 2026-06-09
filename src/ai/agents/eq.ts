// src/ai/agents/eq.ts
import { buildMessagesEQ } from "../prompts/modules/eq";
import { registerUsage } from "../client/registerUsage"; // ✅ registro IA global
import { getAgentConfig, buildCultureEnrichedPrompt } from "./getAgentConfig"; // ✅ cultura corporativa
import { getOpenAIClient } from "@/lib/openai/client";

export const EqAgent = {
  id: "eq",
  name: "Rowi EQ",
  color: "#7c3aed",
  model: "gpt-4o-mini",

  async run({
    ask = "",
    locale = "es",
    language = "Español",
    tenantId = "six-seconds-global",
  }: {
    ask?: string;
    locale?: string;
    language?: string;
    tenantId?: string;
  }) {
    try {
      /* 🔐 Obtener cliente de OpenAI */
      const ai = await getOpenAIClient();

      /* =========================================================
         🏢 0. Cargar cultura corporativa del tenant (si existe)
      ========================================================= */
      const agentConfig = await getAgentConfig("eq", tenantId);

      /* =========================================================
         🧠 1. Contexto del sistema — Inteligencia Emocional K·C·G
      ========================================================= */
      const basePrompt = `
Eres Rowi, un coach experto en Inteligencia Emocional del modelo Six Seconds.
Usa el marco KCG (Reconocer, Comprender, Elegir) y sé cálido, empático y breve (máx 3 frases).
No repitas teoría, hazlo práctico y emocionalmente inteligente.`;

      // Enriquecer con cultura corporativa si existe
      const system = buildCultureEnrichedPrompt(basePrompt, agentConfig, language);

      /* =========================================================
         🚀 2. Llamado a OpenAI
      ========================================================= */
      const completion = await ai.chat.completions.create({
        model: agentConfig?.model || this.model,
        temperature: 0.7,
        max_tokens: 220,
        messages: [
          { role: "system", content: system },
          { role: "user", content: ask || "Hola Rowi" },
        ],
      });

      const text =
        completion.choices[0]?.message?.content?.trim() ??
        "🤔 No tengo respuesta por ahora.";

      /* =========================================================
         📊 3. Registro del uso IA (tokens y costo)
      ========================================================= */
      const tokensInput = completion.usage?.prompt_tokens || 0;
      const tokensOutput = completion.usage?.completion_tokens || 0;
      const costUsd = ((tokensInput + tokensOutput) / 1000) * 0.002;

      await registerUsage({
        tenantId,
        feature: "EQ",
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
      console.error("[EqAgent] error:", e);
      return (
        e?.message ||
        {
          es: "Error procesando inteligencia emocional.",
          en: "Error processing emotional intelligence.",
          pt: "Erro ao processar inteligência emocional.",
          it: "Errore durante l'elaborazione dell'intelligenza emotiva.",
        }[locale]
      );
    }
  },
};