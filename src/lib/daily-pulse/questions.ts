/**
 * Daily Pulse — 1 pregunta corta por día rotando por las 8 SEI competencies.
 *
 * El día de cada usuario se calcula con `dayOfYear() % 8`. Esto garantiza
 * que un usuario que entra todos los días cubre las 8 competencias cada
 * 8 días, y siempre verá la misma pregunta el mismo día (idempotente).
 *
 * Cada respuesta:
 *  - Se graba como PulsePointSignal (source: "daily_pulse", value: 1-5).
 *  - Suma +5 puntos a UserPoints con reason MICRO_LEARNING.
 *  - Actualiza UserStreak (consecutive days).
 *
 * El mapeo SeiKey → PulsePointCode usa el BE2GROW canónico para que las
 * señales del Daily Pulse alimenten el motor de inferencia de Vital Signs.
 */
import type { SeiKey, PulsePointCode } from "@/lib/vital-signs/catalog";

export interface DailyPulseQuestion {
  sei: SeiKey;
  /** Pulse Point al que alimenta la señal (BE2GROW). */
  pulsePointCode: PulsePointCode;
  esQuestion: string;
  enQuestion: string;
  esFeedback: {
    low: string; // 1-2
    mid: string; // 3
    high: string; // 4-5
  };
  enFeedback: {
    low: string;
    mid: string;
    high: string;
  };
}

export const SEI_ORDER: SeiKey[] = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

export const DAILY_PULSE_QUESTIONS: Record<SeiKey, DailyPulseQuestion> = {
  EL: {
    sei: "EL",
    pulsePointCode: "EXECUTION_FEEDBACK",
    esQuestion: "Hoy, ¿con qué precisión puedes nombrar lo que sientes?",
    enQuestion: "Today, how precisely can you name what you're feeling?",
    esFeedback: {
      low: "Las emociones aún están borrosas. Intenta darles un nombre concreto antes de actuar.",
      mid: "Las reconoces pero todavía cuesta separar matices. La alfabetización emocional se entrena.",
      high: "Tu vocabulario emocional está afilado hoy. Esa precisión es la base del autocuidado.",
    },
    enFeedback: {
      low: "Emotions are still blurry. Try giving them a specific name before acting.",
      mid: "You recognize them but separating nuances is still hard. Emotional literacy is trainable.",
      high: "Your emotional vocabulary is sharp today. That precision is the foundation of self-care.",
    },
  },
  RP: {
    sei: "RP",
    pulsePointCode: "MOTIVATION_MASTERY",
    esQuestion: "¿Notas algún patrón emocional repitiéndose en tu semana?",
    enQuestion: "Do you notice an emotional pattern repeating in your week?",
    esFeedback: {
      low: "Los patrones se esconden cuando no miras. Mañana intenta notar la repetición.",
      mid: "Algo se está revelando. Anótalo: lo que se ve, se puede cambiar.",
      high: "Ver el patrón es la mitad del trabajo. La otra mitad es decidir qué hacer con él.",
    },
    enFeedback: {
      low: "Patterns hide when you don't look. Tomorrow try to notice the repetition.",
      mid: "Something is showing up. Write it down: what's seen can be changed.",
      high: "Seeing the pattern is half the work. The other half is deciding what to do with it.",
    },
  },
  ACT: {
    sei: "ACT",
    pulsePointCode: "EXECUTION_ACCOUNTABILITY",
    esQuestion: "Antes de tu próxima decisión hoy, ¿cuánto pesan las consecuencias?",
    enQuestion: "Before your next decision today, how much do consequences weigh?",
    esFeedback: {
      low: "El impulso manda. Una pausa breve cambia el resultado.",
      mid: "Estás midiendo, pero el corto plazo todavía gana. Estira el horizonte.",
      high: "Pensamiento consecuente activo. Esa es la diferencia entre reaccionar y responder.",
    },
    enFeedback: {
      low: "Impulse is in charge. A short pause changes the outcome.",
      mid: "You're weighing, but short-term still wins. Stretch the horizon.",
      high: "Consequential thinking active. That's the difference between reacting and responding.",
    },
  },
  NE: {
    sei: "NE",
    pulsePointCode: "TEAMWORK_JOY",
    esQuestion: "Hoy, ¿qué tan bien navegas una emoción incómoda sin reprimirla?",
    enQuestion: "Today, how well do you navigate an uncomfortable emotion without suppressing it?",
    esFeedback: {
      low: "Reprimir cuesta caro. Las emociones reprimidas no desaparecen, se reagrupan.",
      mid: "Empiezas a quedarte con la sensación. Esa tolerancia es músculo emocional.",
      high: "Estás con la emoción sin que te arrastre. Ese es el espacio donde se elige.",
    },
    enFeedback: {
      low: "Suppression is expensive. Repressed emotions don't disappear, they regroup.",
      mid: "You're starting to stay with the sensation. That tolerance is emotional muscle.",
      high: "You're with the emotion without being swept away. That's the space where you choose.",
    },
  },
  IM: {
    sei: "IM",
    pulsePointCode: "MOTIVATION_AUTONOMY",
    esQuestion: "¿Cuánta de tu energía hoy viene de adentro vs. de la presión externa?",
    enQuestion: "How much of today's energy comes from within vs. external pressure?",
    esFeedback: {
      low: "La motivación externa quema rápido. Conéctate con un por qué propio.",
      mid: "Mezclada. Identifica qué parte es tuya y dale prioridad.",
      high: "Motivación intrínseca alta. Esa energía es sostenible y la sientes diferente.",
    },
    enFeedback: {
      low: "External motivation burns out fast. Reconnect with a why of your own.",
      mid: "Mixed. Identify which part is yours and prioritize it.",
      high: "High intrinsic motivation. That energy is sustainable and you feel it differently.",
    },
  },
  OP: {
    sei: "OP",
    pulsePointCode: "CHANGE_IMAGINATION",
    esQuestion: "¿Qué tan posible te parece hoy un mejor resultado en algo que te preocupa?",
    enQuestion: "How possible does a better outcome seem today for something worrying you?",
    esFeedback: {
      low: "El pesimismo cierra opciones. Una sola alternativa que veas reabre el camino.",
      mid: "Hay luz pero también nubes. Lista 3 escenarios posibles, no solo el peor.",
      high: "Optimismo ejercitado, no ingenuo. Ves posibilidad sin negar realidad.",
    },
    enFeedback: {
      low: "Pessimism closes options. One alternative you can see reopens the path.",
      mid: "There's light but also clouds. List 3 possible scenarios, not just the worst.",
      high: "Exercised optimism, not naive. You see possibility without denying reality.",
    },
  },
  EMP: {
    sei: "EMP",
    pulsePointCode: "TRUST_CARE",
    esQuestion: "¿Cuándo te detuviste hoy a sentir lo que otra persona está sintiendo?",
    enQuestion: "When did you pause today to feel what another person is feeling?",
    esFeedback: {
      low: "La empatía requiere parar. Tu próximo encuentro hoy puede ser ese momento.",
      mid: "Hubo un destello. Quédate más tiempo la próxima vez, sin solucionar.",
      high: "Empatía activa. Estuviste con alguien sin querer arreglarlo, y eso conecta.",
    },
    enFeedback: {
      low: "Empathy requires stopping. Your next encounter today can be that moment.",
      mid: "There was a flash. Stay longer next time, without fixing.",
      high: "Active empathy. You were with someone without trying to fix it, and that connects.",
    },
  },
  NG: {
    sei: "NG",
    pulsePointCode: "MOTIVATION_MEANING",
    esQuestion: "Lo que hiciste hoy, ¿conecta con algo más grande que vos?",
    enQuestion: "Does what you did today connect with something bigger than you?",
    esFeedback: {
      low: "Sin un propósito que trascienda, todo cansa más. ¿Cuál es el tuyo?",
      mid: "El hilo está pero a veces se afloja. Hazlo visible esta semana.",
      high: "Operando desde una causa noble. Esa orientación cambia la calidad de cada hora.",
    },
    enFeedback: {
      low: "Without a purpose that transcends, everything tires more. What's yours?",
      mid: "The thread is there but sometimes loose. Make it visible this week.",
      high: "Operating from a noble goal. That orientation changes the quality of every hour.",
    },
  },
};

import { localDayOfYear } from "./timezone";

/**
 * Devuelve la pregunta del día rotando por (dayOfYear LOCAL del usuario) % 8.
 * Si no se pasa tzOffsetMinutes, asume UTC (offset 0).
 */
export function questionForToday(
  now: Date = new Date(),
  tzOffsetMinutes: number = 0,
): DailyPulseQuestion {
  const dayOfYear = localDayOfYear(now, tzOffsetMinutes);
  const sei = SEI_ORDER[dayOfYear % SEI_ORDER.length];
  return DAILY_PULSE_QUESTIONS[sei];
}

export function feedbackForValue(
  q: DailyPulseQuestion,
  value: number,
  lang: "es" | "en",
): string {
  const bucket = value <= 2 ? "low" : value === 3 ? "mid" : "high";
  return lang === "en" ? q.enFeedback[bucket] : q.esFeedback[bucket];
}
