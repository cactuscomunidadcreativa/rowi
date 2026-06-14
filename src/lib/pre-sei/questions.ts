/**
 * Pre-SEI — reflejo emocional rápido de 8 preguntas (una por competencia SEI).
 * De cara al usuario es un "espejo / selfie emocional", nunca un diagnóstico
 * (ese término queda reservado al módulo consultor).
 *
 * NO es un catálogo nuevo: reusa las 8 preguntas de `daily-pulse/questions.ts`
 * (una por competencia KCG, en 4 idiomas, con feedback low/mid/high y mapeo a
 * `pulsePointCode` BE2GROW). El Pre-SEI las toma TODAS de una sentada, en orden
 * `SEI_ORDER`, en vez de una por día.
 *
 * Diferencia de framing: el Daily Pulse pregunta en tono "hoy/diario"
 * ("Hoy, ¿con qué precisión...?"). El Pre-SEI es un reflejo de una sola vez,
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
import { localDayOfYear } from "@/lib/daily-pulse/timezone";
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

/**
 * Variantes ADICIONALES del enunciado intake (la de PRE_SEI_INTAKE_PROMPTS es
 * la variante 0). El espejo ROTA la redacción por día: quien lo retoma otro
 * día ve frases distintas que miden lo mismo (feedback Eduardo 2026-06-10:
 * "me siguen saliendo las mismas preguntas en el mirror").
 *
 * Misma competencia, misma escala 1-5, misma polaridad. El scoring es por
 * clave SEI, independiente de la redacción (scoring.ts no cambia).
 *
 * PENDIENTE DE APROBACIÓN (Eduardo): copy nuevo.
 */
export const PRE_SEI_INTAKE_EXTRA_VARIANTS: Record<
  SeiKey,
  Array<Record<PulseLang, string>>
> = {
  EL: [
    {
      es: "Cuando sientes algo intenso, ¿qué tan rápido puedes ponerle nombre?",
      en: "When you feel something intense, how quickly can you name it?",
      pt: "Quando você sente algo intenso, com que rapidez consegue dar um nome?",
      it: "Quando provi qualcosa di intenso, quanto velocemente riesci a dargli un nome?",
    },
    {
      es: "¿Qué tan rico es tu vocabulario para describir lo que sientes?",
      en: "How rich is your vocabulary for describing what you feel?",
      pt: "Quão rico é o seu vocabulário para descrever o que sente?",
      it: "Quanto è ricco il tuo vocabolario per descrivere ciò che senti?",
    },
  ],
  RP: [
    {
      es: "¿Qué tanto reconoces qué situaciones disparan tus reacciones?",
      en: "How much do you recognize which situations trigger your reactions?",
      pt: "O quanto você reconhece quais situações disparam suas reações?",
      it: "Quanto riconosci quali situazioni innescano le tue reazioni?",
    },
    {
      es: "¿Con qué frecuencia te descubres repitiendo la misma reacción emocional?",
      en: "How often do you catch yourself repeating the same emotional reaction?",
      pt: "Com que frequência você se descobre repetindo a mesma reação emocional?",
      it: "Con quale frequenza ti scopri a ripetere la stessa reazione emotiva?",
    },
  ],
  ACT: [
    {
      es: "¿Qué tan seguido pausas antes de reaccionar?",
      en: "How often do you pause before reacting?",
      pt: "Com que frequência você pausa antes de reagir?",
      it: "Quanto spesso ti fermi prima di reagire?",
    },
    {
      es: "Cuando algo te altera, ¿cuánto pesas el costo de tu reacción antes de actuar?",
      en: "When something upsets you, how much do you weigh the cost of your reaction before acting?",
      pt: "Quando algo lhe altera, o quanto você pesa o custo da sua reação antes de agir?",
      it: "Quando qualcosa ti altera, quanto pesi il costo della tua reazione prima di agire?",
    },
  ],
  NE: [
    {
      es: "Cuando una emoción te incomoda, ¿qué tan bien la usas a tu favor?",
      en: "When an emotion makes you uncomfortable, how well do you use it in your favor?",
      pt: "Quando uma emoção lhe incomoda, quão bem você a usa a seu favor?",
      it: "Quando un'emozione ti mette a disagio, quanto bene la usi a tuo favore?",
    },
    {
      es: "¿Qué tan capaz te sientes de cambiar tu estado emocional cuando lo necesitas?",
      en: "How able do you feel to shift your emotional state when you need to?",
      pt: "Quão capaz você se sente de mudar seu estado emocional quando precisa?",
      it: "Quanto ti senti capace di cambiare il tuo stato emotivo quando ne hai bisogno?",
    },
  ],
  IM: [
    {
      es: "¿Qué tanto de lo que haces nace de tus propias ganas y no del deber?",
      en: "How much of what you do comes from your own desire rather than duty?",
      pt: "O quanto do que você faz nasce da sua própria vontade e não do dever?",
      it: "Quanto di ciò che fai nasce dalla tua volontà e non dal dovere?",
    },
    {
      es: "Sin presión externa, ¿cuánta energía te queda para lo que importa?",
      en: "Without external pressure, how much energy do you have left for what matters?",
      pt: "Sem pressão externa, quanta energia lhe sobra para o que importa?",
      it: "Senza pressione esterna, quanta energia ti resta per ciò che conta?",
    },
  ],
  OP: [
    {
      es: "Cuando algo sale mal, ¿qué tan rápido ves caminos alternativos?",
      en: "When something goes wrong, how quickly do you see alternative paths?",
      pt: "Quando algo dá errado, com que rapidez você vê caminhos alternativos?",
      it: "Quando qualcosa va storto, quanto velocemente vedi strade alternative?",
    },
    {
      es: "¿Qué tanto sientes que tus acciones pueden cambiar un mal momento?",
      en: "How much do you feel your actions can change a bad moment?",
      pt: "O quanto você sente que suas ações podem mudar um momento ruim?",
      it: "Quanto senti che le tue azioni possono cambiare un momento difficile?",
    },
  ],
  EMP: [
    {
      es: "¿Qué tan bien captas lo que otros sienten aunque no lo digan?",
      en: "How well do you pick up on what others feel even when they don't say it?",
      pt: "Quão bem você capta o que os outros sentem mesmo quando não dizem?",
      it: "Quanto bene cogli ciò che gli altri provano anche quando non lo dicono?",
    },
    {
      es: "Cuando alguien te importa, ¿qué tanto sientes su emoción como propia?",
      en: "When someone matters to you, how much do you feel their emotion as your own?",
      pt: "Quando alguém importa para você, o quanto você sente a emoção dele como sua?",
      it: "Quando qualcuno ti sta a cuore, quanto senti la sua emozione come tua?",
    },
  ],
  NG: [
    {
      es: "¿Qué tan presente está tu propósito en tus decisiones cotidianas?",
      en: "How present is your purpose in your everyday decisions?",
      pt: "Quão presente está o seu propósito nas suas decisões cotidianas?",
      it: "Quanto è presente il tuo scopo nelle tue decisioni quotidiane?",
    },
    {
      es: "¿Qué tanto sientes que tu día a día deja huella en otros?",
      en: "How much do you feel your day-to-day leaves a mark on others?",
      pt: "O quanto você sente que o seu dia a dia deixa marca nos outros?",
      it: "Quanto senti che la tua quotidianità lascia un segno negli altri?",
    },
  ],
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
 * Devuelve las 8 preguntas del Pre-SEI, localizadas, en orden `SEI_ORDER`.
 * La REDACCIÓN rota por día (UTC): retomar el espejo otro día muestra
 * variantes distintas del enunciado que miden la misma competencia.
 */
export function preSeiQuestions(
  lang: PulseLang,
  now: Date = new Date(),
): PreSeiQuestionView[] {
  const dayOfYear = localDayOfYear(now, 0);
  return SEI_ORDER.map((sei, index) => {
    const variants = [
      PRE_SEI_INTAKE_PROMPTS[sei],
      ...(PRE_SEI_INTAKE_EXTRA_VARIANTS[sei] ?? []),
    ];
    const variant = variants[dayOfYear % variants.length];
    return {
      sei,
      index,
      prompt: variant[lang],
      pulsePointCode: DAILY_PULSE_QUESTIONS[sei].pulsePointCode,
    };
  });
}
