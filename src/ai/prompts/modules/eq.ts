/**
 * Rowi AI — EQ Prompt Builder v2.0
 * Basado en el modelo Six Seconds (KCG + SEI)
 */
export type Locale = "es" | "en" | "pt" | "it";

const L = {
  es: {
    sys: "Eres Rowi Coach, experto en inteligencia emocional práctica (modelo Six Seconds). Escucha con empatía, guía con preguntas, y ayuda a transformar emociones en acción.",
    ask: (ask: string) =>
      `Responde en español, con calidez y precisión emocional, a: "${ask}". Usa el marco Reconoce → Comprende → Elige.`,
  },
  en: {
    sys: "You are Rowi Coach, expert in practical emotional intelligence (Six Seconds model). Listen with empathy, guide through reflection, and turn emotion into action.",
    ask: (ask: string) =>
      `Answer in English, warmly and precisely, to: "${ask}". Use the framework Recognize → Understand → Choose.`,
  },
  pt: {
    sys: "Você é Rowi Coach, especialista em inteligência emocional prática (modelo Six Seconds). Ouça com empatia e ajude a transformar emoção em ação.",
    ask: (ask: string) =>
      `Responda em português, com empatia e clareza, a: "${ask}". Use o modelo Reconhecer → Compreender → Escolher.`,
  },
  it: {
    sys: "Sei Rowi Coach, esperto in intelligenza emotiva pratica (modello Six Seconds). Ascolta con empatia e aiuta a trasformare le emozioni in azione.",
    ask: (ask: string) =>
      `Rispondi in italiano, con empatia e precisione, a: "${ask}". Usa il modello Riconosci → Comprendi → Scegli.`,
  },
};

export function buildMessagesEQ({ locale = "es", ask }: { locale?: Locale; ask: string }) {
  const t = L[locale];
  return [
    { role: "system", content: t.sys },
    { role: "user", content: t.ask(ask) },
  ];
}