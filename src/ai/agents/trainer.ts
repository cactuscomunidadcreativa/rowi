// src/ai/agents/trainer.ts
import OpenAI from "openai";
import { buildMessagesTrainer } from "../prompts/modules/trainer";
import { registerUsage } from "../client/registerUsage";
import { getAgentConfig, buildCultureEnrichedPrompt } from "./getAgentConfig";

const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const TrainerAgent = {
  id: "trainer",
  name: "Rowi Trainer",
  color: "#e76f51",
  model: "gpt-4o-mini",
  description:
    "Entrenador personal de hábitos y emociones basado en el modelo Six Seconds.",

  async run({
    ask = "",
    locale = "es",
    tenantId = "rowi-master",
    focus = "hábitos y emociones diarias",
    memory = [],
  }: {
    ask?: string;
    locale?: string;
    tenantId?: string;
    focus?: string;
    memory?: any[];
  }) {
    try {
      /* 🏢 0. Cargar cultura corporativa del tenant */
      const agentConfig = await getAgentConfig("trainer", tenantId);

      const langName =
        locale === "en" ? "English" :
        locale === "pt" ? "Português" :
        locale === "it" ? "Italiano" : "Español";

      /* =========================================================
         🧠 1. Construcción del prompt (builder del módulo Trainer)
         ⚠️ El builder se mantiene, solo agregamos cultura
      ========================================================= */
      const validLocale = (["es", "en", "pt", "it"].includes(locale) ? locale : "es") as "es" | "en" | "pt" | "it";
      const messages = buildMessagesTrainer({
        locale: validLocale,
        ask: focus ? `${ask} (enfoque: ${focus})` : ask,
      });

      // Enriquecer el system prompt con cultura corporativa
      if (messages[0] && agentConfig) {
        messages[0].content = buildCultureEnrichedPrompt(
          messages[0].content as string,
          agentConfig,
          langName
        );
      }

      /* =========================================================
         🚀 2. Llamado a OpenAI
      ========================================================= */
      const completion = await ai.chat.completions.create({
        model: agentConfig?.model || this.model,
        temperature: 0.7,
        max_tokens: 220,
        messages: messages as any,
      });

      const text = completion.choices[0]?.message?.content?.trim() ?? "🏋️ No tengo acciones aún.";

      /* =========================================================
         📊 3. Registro del uso IA (tokens y costo)
      ========================================================= */
      const tokensInput = completion.usage?.prompt_tokens || 0;
      const tokensOutput = completion.usage?.completion_tokens || 0;
      const costUsd = ((tokensInput + tokensOutput) / 1000) * 0.002;

      await registerUsage({
        tenantId,
        feature: "TRAINER",
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
      console.error("[TrainerAgent] error:", e);
      return (
        e?.message ||
        {
          es: "Error procesando entrenamiento.",
          en: "Error processing training.",
          pt: "Erro ao processar treinamento.",
          it: "Errore durante l'elaborazione dell'allenamento.",
        }[locale]
      );
    }
  },
};