// src/ai/agents/sales.ts
import { buildMessagesSales } from "../prompts/modules/sales";
import { registerUsage } from "../client/registerUsage";
import { getAgentConfig, buildCultureEnrichedPrompt } from "./getAgentConfig";
import { getOpenAIClient } from "@/lib/openai/client";

export const SalesAgent = {
  id: "sales",
  name: "Rowi Sales",
  color: "#f4a261",
  model: "gpt-4o-mini",

  async run({
    ask = "",
    locale = "es",
    tenantId = "rowi-master",
    language = "Español",
  }: {
    ask?: string;
    locale?: string;
    tenantId?: string;
    language?: string;
  }) {
    try {
      /* 🔐 Obtener cliente de OpenAI */
      const ai = await getOpenAIClient();

      /* 🏢 0. Cargar cultura corporativa del tenant */
      const agentConfig = await getAgentConfig("sales", tenantId);

      /* =========================================================
         🧠 1. Contexto del sistema
         ⚠️ Este prompt se mantiene aquí para seguir editándolo
      ========================================================= */
      const basePrompt = `
Eres Rowi Sales, un coach de ventas y negociación emocional.
Responde siempre en ${language}.
Usa técnicas de inteligencia emocional y persuasión ética.
Ofrece ejemplos de frases y maneras de superar objeciones.`;

      // Agregar cultura corporativa SIN modificar el prompt base
      const system = buildCultureEnrichedPrompt(basePrompt, agentConfig, language);

      /* =========================================================
         🚀 2. Llamado a OpenAI
      ========================================================= */
      const completion = await ai.chat.completions.create({
        model: agentConfig?.model || this.model,
        temperature: 0.7,
        max_tokens: 240,
        messages: [
          {
            role: "system",
            content: system,
          },
          {
            role: "user",
            content: ask || "Cómo mejorar mi cierre de ventas",
          },
        ],
      });

      const text =
        completion.choices[0].message?.content?.trim() ||
        "💬 No tengo sugerencias ahora.";

      /* =========================================================
         📊 3. Registro del uso IA (tokens y costo)
      ========================================================= */
      const tokensInput = completion.usage?.prompt_tokens || 0;
      const tokensOutput = completion.usage?.completion_tokens || 0;
      const costUsd = ((tokensInput + tokensOutput) / 1000) * 0.002; // costo estimado gpt-4o-mini

      await registerUsage({
        tenantId,
        feature: "SALES",
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
      console.error("[SalesAgent] error:", e);
      return (
        e?.message ||
        {
          es: "Error procesando ventas.",
          en: "Error processing sales.",
          pt: "Erro ao processar vendas.",
          it: "Errore durante l'elaborazione delle vendite.",
        }[locale]
      );
    }
  },
};