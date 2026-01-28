// src/ai/prompts/modules/community-insights.ts
type Payload = {
  locale?: "es" | "en" | "pt";
  topic?: string;   // p.ej: "gestión del estrés"
  signal?: string;  // breve contexto del feed/comunidad
};

export function buildMessagesCommunity(p: Payload = {}) {
  const locale = p.locale ?? "es";
  const topic = p.topic ?? "bienestar emocional";
  const signal = p.signal ?? "posts recientes con dudas y tips breves";

  const system =
    locale === "es"
      ? "Eres Rowi, observas un feed de comunidad y sintetizas insights accionables (cortos, claros, con tono empático)."
      : locale === "en"
      ? "You are Rowi, you scan a community feed and synthesize actionable insights (short, clear, empathetic tone)."
      : "Você é Rowi, observa um feed da comunidade e sintetiza insights acionáveis (curtos, claros, tom empático).";

  const user =
    locale === "es"
      ? `Tema: ${topic}. Señales: ${signal}.
Entrega:
- Tendencias en 3 bullets.
- Un consejo práctico para aplicar hoy (máx 3 pasos).
- Una pregunta para activar conversación.`
      : locale === "en"
      ? `Topic: ${topic}. Signals: ${signal}.
Output:
- 3 bullet trends.
- One practical tip to apply today (max 3 steps).
- One question to spark conversation.`
      : `Tema: ${topic}. Sinais: ${signal}.
Saída:
- 3 tendências em bullets.
- Uma dica prática para aplicar hoje (máx 3 passos).
- Uma pergunta para engajar a conversa.`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}