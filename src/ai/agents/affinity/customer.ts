// src/ai/agents/affinity/customer.ts
import OpenAI from "openai";
import { registerUsage } from "../../client/registerUsage";

/**
 * 💼 AffinityCustomerAgent
 * ----------------------------------------------------------
 * Analiza afinidad con clientes o usuarios (relaciones externas, B2B/B2C).
 * En planes futuros se conecta con CRM / feedback de clientes.
 */

const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const AffinityCustomerAgent = {
  name: "Rowi Affinity Customer Coach",
  color: "#f59e0b",
  model: "gpt-4o-mini",

  async run({
    locale = "es",
    tenantId = "rowi-master",
    payload = {},
  }: {
    locale?: "es" | "en" | "pt" | "it";
    tenantId?: string;
    payload?: Record<string, any>;
  }) {
    try {
      const langName =
        locale === "en"
          ? "English"
          : locale === "pt"
          ? "Português"
          : locale === "it"
          ? "Italiano"
          : "Español";

      const context = payload?.summary
        ? JSON.stringify(payload.summary, null, 2)
        : "Sin datos específicos.";

      const prompt = `
Eres Rowi, un coach de afinidad enfocado en relaciones con clientes.
Analiza el estado emocional de la relación comercial y su potencial de conexión.
Usa lenguaje empático y profesional, con máximo 3 párrafos.
Idioma: ${langName}.
Datos: ${context}
`;

      const completion = await ai.chat.completions.create({
        model: this.model,
        temperature: 0.6,
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content: `You are Rowi, an expert in client relationship coaching.
            Respond only in ${langName}, warmly and professionally.`,
          },
          { role: "user", content: prompt },
        ],
      });

      const text = completion.choices?.[0]?.message?.content?.trim() || "";
      const tokensInput = completion.usage?.prompt_tokens || 0;
      const tokensOutput = completion.usage?.completion_tokens || 0;
      const costUsd = ((tokensInput + tokensOutput) / 1000) * 0.002;

      await registerUsage({
        tenantId,
        feature: "AFFINITY_CUSTOMER",
        model: this.model,
        tokensInput,
        tokensOutput,
        costUsd,
      });

      return {
        answer: text,
        tokens: { input: tokensInput, output: tokensOutput },
        costUsd,
      };
    } catch (e: any) {
      console.error("[AffinityCustomerAgent] error:", e);
      return {
        answer: `Error al analizar afinidad con cliente: ${e?.message || "desconocido"}`,
      };
    }
  },
};