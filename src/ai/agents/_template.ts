// src/ai/agents/_template.ts
import { buildMessagesEQ, type Locale } from "../prompts/modules/eq";
import { OpenAI } from "openai";

const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const EqAgent = {
  id: "eq",
  name: "EQ Coach",
  model: "gpt-4o-mini" as const,
  color: "#d797cf",
  description: "Ayuda a reflexionar y fortalecer competencias de Inteligencia Emocional (Six Seconds).",

  async run({ locale = "es", ask = "", userId }: { locale?: Locale; ask: string; userId?: string }) {
    const messages = buildMessagesEQ({ locale, ask });
    const completion = await ai.chat.completions.create({
      model: this.model,
      temperature: 0.6,
      messages: messages as any,
    });
    const answer = completion.choices[0]?.message?.content?.trim() || "";
    return { agent: this.name, answer, locale };
  },
};