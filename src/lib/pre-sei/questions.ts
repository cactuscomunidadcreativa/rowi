/**
 * Pre-SEI — diagnóstico EQ rápido de 8 preguntas (una por competencia SEI).
 *
 * NO es un catálogo nuevo: reusa las 8 preguntas de `daily-pulse/questions.ts`
 * (una por competencia KCG, en 4 idiomas, con feedback low/mid/high y mapeo a
 * `pulsePointCode` BE2GROW). El Pre-SEI las toma TODAS de una sentada, en orden
 * `SEI_ORDER`, en vez de una por día.
 *
 * Diferencia de framing: el Daily Pulse pregunta en tono "hoy/diario"
 * ("Hoy, ¿con qué precisión...?"). El Pre-SEI es un diagnóstico de una sola vez,
 * así que ofrecemos una variante "intake" del enunciado en tono general
 * (presente atemporal). El contenido base —competencia, pulse point, feedback—
 * NO se duplica; solo el enunciado tiene una segunda redacción opcional.
 *
 * El insight resultante es PRE-NORMADO e hipótesis (no diagnóstico clínico):
 * ver `scoring.ts` y `normative.ts`.
 */
import {
  DAILY_PULSE_QUESTIONS,
  SEI_ORDER,
  type DailyPulseQuestion,
  type PulseLang,
} from "@/lib/daily-pulse/questions";
import type { SeiKey } from "@/lib/vital-signs/catalog";

export { SEI_ORDER };
export type { PulseLang, SeiKey };

/** Las 8 preguntas del Pre-SEI = las del Daily Pulse, reusadas sin duplicar. */
export const PRE_SEI_QUESTIONS = DAILY_PULSE_QUESTIONS;

/** Número de preguntas del Pre-SEI (una por competencia SEI). */
export const PRE_SEI_LENGTH = SEI_ORDER.length;

/**
 * Variante "intake" del enunciado, en tono general (no "hoy"), por competencia
 * y por idioma. Solo el ENUNCIADO; el feedback se reusa de DAILY_PULSE_QUESTIONS.
 *
 * PENDIENTE DE APROBACIÓN (Eduardo): copy propuesto para el diagnóstico de una
 * sentada. Inclusivo, no clínico, segunda persona neutra.
 */
export const PRE_SEI_INTAKE_PROMPTS: Record<
  SeiKey,
  Record<PulseLang, string>
> = {
  EL: {
    es: "¿Con qué precisión sueles poder nombrar lo que sientes?",
    en: "How precisely can you usually name what you feel?",
    pt: "Com que precisão você costuma conseguir nomear o que sente?",
    it: "Con quanta precisione riesci di solito a dare un nome a ciò che senti?",
  },
  RP: {
    es: "¿Qué tanto notas patrones emocionales que se repiten en ti?",
    en: "How much do you notice emotional patterns that repeat in you?",
    pt: "O quanto você nota padrões emocionais que se repetem em você?",
    it: "Quanto noti schemi emotivi che si ripetono in te?",
  },
  ACT: {
    es: "Antes de decidir, ¿cuánto sueles pesar las consecuencias a futuro?",
    en: "Before deciding, how much do you usually weigh future consequences?",
    pt: "Antes de decidir, o quanto você costuma pesar as consequências futuras?",
    it: "Prima di decidere, quanto pesi di solito le conseguenze future?",
  },
  NE: {
    es: "¿Qué tan bien navegas una emoción incómoda sin reprimirla?",
    en: "How well do you navigate an uncomfortable emotion without suppressing it?",
    pt: "Quão bem você navega uma emoção incômoda sem reprimi-la?",
    it: "Quanto bene navighi un'emozione scomoda senza reprimerla?",
  },
  IM: {
    es: "¿Cuánta de tu energía viene de adentro, más que de la presión externa?",
    en: "How much of your energy comes from within, rather than external pressure?",
    pt: "Quanta da sua energia vem de dentro, mais do que da pressão externa?",
    it: "Quanta della tua energia viene da dentro, più che dalla pressione esterna?",
  },
  OP: {
    es: "Ante algo que te preocupa, ¿qué tan posible te parece un mejor resultado?",
    en: "Facing something that worries you, how possible does a better outcome seem?",
    pt: "Diante de algo que lhe preocupa, quão possível lhe parece um resultado melhor?",
    it: "Di fronte a qualcosa che ti preoccupa, quanto ti sembra possibile un risultato migliore?",
  },
  EMP: {
    es: "¿Con qué frecuencia te detienes a sentir lo que otra persona está sintiendo?",
    en: "How often do you pause to feel what another person is feeling?",
    pt: "Com que frequência você para para sentir o que outra pessoa está sentindo?",
    it: "Con quanta frequenza ti fermi a sentire ciò che un'altra persona sta provando?",
  },
  NG: {
    es: "¿Qué tanto lo que haces conecta con algo más grande que tú?",
    en: "How much does what you do connect with something bigger than you?",
    pt: "O quanto o que você faz conecta com algo maior que você?",
    it: "Quanto ciò che fai è collegato a qualcosa di più grande di te?",
  },
};

export interface PreSeiQuestionView {
  /** Competencia SEI que mide esta pregunta. */
  sei: SeiKey;
  /** Índice 0-based en el orden del Pre-SEI. */
  index: number;
  /** Enunciado localizado (variante intake). */
  prompt: string;
  /** Pulse point BE2GROW al que alimenta la señal. */
  pulsePointCode: DailyPulseQuestion["pulsePointCode"];
}

/**
 * Devuelve las 8 preguntas del Pre-SEI, localizadas, en orden `SEI_ORDER`,
 * usando la variante "intake" del enunciado.
 */
export function preSeiQuestions(lang: PulseLang): PreSeiQuestionView[] {
  return SEI_ORDER.map((sei, index) => ({
    sei,
    index,
    prompt: PRE_SEI_INTAKE_PROMPTS[sei][lang],
    pulsePointCode: DAILY_PULSE_QUESTIONS[sei].pulsePointCode,
  }));
}
