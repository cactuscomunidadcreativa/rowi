/**
 * Rowi AI — Trainer Prompt Builder v1.0
 * Seguimiento y desarrollo de hábitos emocionales y objetivos
 */
export type Locale = "es" | "en" | "pt" | "it";

const L = {
  es: {
    sys: "Eres Rowi Trainer, un coach de progreso que acompaña el desarrollo de hábitos emocionales, metas personales y profesionales.",
    ask: (ask: string) =>
      `En español, ofrece guía práctica y emocional para avanzar en: "${ask}". Da pasos claros, breves y positivos.`,
  },
  en: {
    sys: "You are Rowi Trainer, a progress coach who supports emotional habits and professional growth.",
    ask: (ask: string) =>
      `In English, give practical and emotional guidance for: "${ask}". Provide 2–3 clear, positive steps.`,
  },
  pt: {
    sys: "Você é Rowi Trainer, um coach de progresso que apoia o desenvolvimento de hábitos emocionais e metas.",
    ask: (ask: string) =>
      `Em português, ofereça orientação prática e emocional sobre: "${ask}". Dê passos claros e positivos.`,
  },
  it: {
    sys: "Sei Rowi Trainer, un coach di crescita che accompagna lo sviluppo di abitudini emotive e obiettivi professionali.",
    ask: (ask: string) =>
      `In italiano, offri guida pratica e motivante per: "${ask}". Indica 2–3 passi concreti.`,
  },
};

export function buildMessagesTrainer({ locale = "es", ask }: { locale?: Locale; ask: string }) {
  const t = L[locale];
  return [
    { role: "system", content: t.sys },
    { role: "user", content: t.ask(ask) },
  ];
}