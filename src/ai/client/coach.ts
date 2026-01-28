// src/ai/coach.ts
import { LEX, LEX_ANY } from "./lexicon";

export type CoachIntent =
  | "eq"
  | "innovation"
  | "execution"
  | "leadership"
  | "conversation"
  | "relationship"
  | "decision"
  | "team";

export type CoachChannel =
  | "whatsapp"
  | "email"
  | "meeting"
  | "speech"
  | "one_on_one";

export type CoachInput = {
  intent: CoachIntent;
  channel?: CoachChannel;
  goal?: string;
  members?: Array<{ id: string; name?: string }>;
  locale?: "es" | "en" | "pt" | "it";
  step?: "recognize" | "understand" | "choose";
  ask?: string; // texto libre del usuario para refinar
};

export type CoachEQOut = {
  phase: "recognize" | "understand" | "choose";
  pause: string; // pausa 6s
  questions: string[]; // no sugerencias
  hints?: string[]; // posibles palabras (si la persona pide)
  next_step_hint?: string; // “luego pasaremos a…”
};

export type CoachPlanOut = {
  structure: string[]; // 3–5 pasos
  drafts?: { primary: string; alt_1?: string; alt_2?: string }; // guiones por canal
  phrases?: string[]; // frases clave (reunión/1:1)
  eco?: { title: string; how: string; minutes: number } | null; // micro rutina prep
  followup?: string[]; // siguientes pasos
  notes?: string[]; // recordatorios/guardrails
};

export type CoachOut = { eq?: CoachEQOut; plan?: CoachPlanOut };

/* ===================== UI por idioma ===================== */
const UI = {
  es: {
    greet: "Tomemos 6 segundos: inhala 3… exhala 3. ¿Listo/a?",
    thanks: "Gracias por contarlo.",
    askName: "Si le pones nombre, ¿qué estás sintiendo ahora?",
    askIntensity: "Del 1 al 10, ¿qué intensidad notas?",
    askFamily:
      "¿Se parece más a tristeza, enojo, miedo, alegría, sorpresa, asco o calma?",
    askBody:
      "¿Dónde lo notas más en el cuerpo (pecho, estómago, nuca, hombros, mandíbula)?",
    uNext1: "Luego pasaremos a comprender qué la genera.",
    uNext2: "Cuando quieras, pasamos a elegir una acción pequeñita (2–5 min).",
    uNext3: "Luego elegiremos una acción pequeña (2–5 min).",
    askCause1: "¿Qué situación o pensamiento dispara esta emoción?",
    askCause2: "¿Qué mensaje útil trae para ti hoy?",
    askNeed: "¿Qué necesitarías ahora mismo (límite, descanso, claridad, apoyo)?",
    choose1:
      "Dime 2–3 opciones pequeñas que podrías probar en los próximos 5–10 minutos.",
    choose2: "¿Cuál se siente más viable ahora mismo?",
    choose3: "¿Cuándo la harás hoy?",
    chooseEco: "Si quieres, adjuntamos una ECO breve como preparación.",
  },
  en: {
    greet: "Let’s take 6 seconds: inhale 3… exhale 3. Ready?",
    thanks: "Thanks for sharing.",
    askName: "If you give it a name, what are you feeling now?",
    askIntensity: "On a scale from 1 to 10, what intensity do you notice?",
    askFamily:
      "Does it feel closer to sadness, anger, fear, joy, surprise, disgust or calm?",
    askBody:
      "Where do you notice it most in your body (chest, stomach, neck, shoulders, jaw)?",
    uNext1: "Next, we’ll explore what’s triggering it.",
    uNext2: "Whenever you’re ready, we’ll choose a small action (2–5 min).",
    uNext3: "Next we’ll pick one small action (2–5 min).",
    askCause1: "What situation or thought triggers this emotion?",
    askCause2: "What useful message might it carry for you today?",
    askNeed: "What do you need right now (boundary, rest, clarity, support)?",
    choose1:
      "Tell me 2–3 small options you could try in the next 5–10 minutes.",
    choose2: "Which one feels most doable right now?",
    choose3: "When will you do it today?",
    chooseEco: "We can add a short ECO routine as preparation, if you want.",
  },
  pt: {
    greet: "Vamos fazer 6 segundos: inspire 3… expire 3. Pronto/a?",
    thanks: "Obrigado por compartilhar.",
    askName: "Se der um nome, o que você está sentindo agora?",
    askIntensity: "De 1 a 10, que intensidade nota?",
    askFamily:
      "Parece mais com tristeza, raiva, medo, alegria, surpresa, nojo ou calma?",
    askBody:
      "Onde nota mais no corpo (peito, estômago, nuca, ombros, mandíbula)?",
    uNext1: "Depois, vamos entender o que está acionando isso.",
    uNext2: "Quando quiser, escolhemos uma ação pequena (2–5 min).",
    uNext3: "Depois vamos escolher uma ação pequena (2–5 min).",
    askCause1: "Que situação ou pensamento aciona essa emoção?",
    askCause2: "Que mensagem útil ela pode trazer para você hoje?",
    askNeed: "Do que você precisa agora (limite, descanso, clareza, apoio)?",
    choose1:
      "Diga 2–3 opções pequenas que você poderia tentar nos próximos 5–10 minutos.",
    choose2: "Qual parece mais viável agora?",
    choose3: "Quando fará isso hoje?",
    chooseEco: "Se quiser, adicionamos uma ECO curta como preparação.",
  },
  it: {
    greet: "Facciamo 6 secondi: inspira 3… espira 3. Pront*?",
    thanks: "Grazie per aver condiviso.",
    askName: "Se gli dai un nome, cosa stai provando ora?",
    askIntensity: "Da 1 a 10, che intensità senti?",
    askFamily:
      "Assomiglia di più a tristezza, rabbia, paura, gioia, sorpresa, disgusto o calma?",
    askBody:
      "Dove lo senti di più nel corpo (petto, stomaco, nuca, spalle, mandibola)?",
    uNext1: "Poi esploriamo cosa la sta generando.",
    uNext2: "Quando vuoi, scegliamo una piccola azione (2–5 min).",
    uNext3: "Poi sceglieremo una piccola azione (2–5 min).",
    askCause1: "Quale situazione o pensiero innesca questa emozione?",
    askCause2: "Che messaggio utile potrebbe portarti oggi?",
    askNeed: "Di cosa hai bisogno ora (limite, riposo, chiarezza, supporto)?",
    choose1:
      "Dimmi 2–3 piccole opzioni che potresti provare nei prossimi 5–10 minuti.",
    choose2: "Quale senti più fattibile ora?",
    choose3: "Quando lo farai oggi?",
    chooseEco: "Se vuoi, aggiungiamo una breve routine ECO come preparazione.",
  },
} as const;

/* ===================== Coach EQ conversacional ===================== */
export function coachEQ(input: CoachInput): CoachOut {
  const lang = (input.locale || "es") as keyof typeof UI;
  const T = UI[lang];

  const phase = (input.step || "recognize") as
    | "recognize"
    | "understand"
    | "choose";
  const txt = (input.ask || "").trim().toLowerCase();

  // heurísticas suaves
  const saidNumber = txt.match(/\b([1-9]|10)\b/);
  const emotionHit = LEX_ANY.find((w) => txt.includes(w.toLowerCase()));
  const bodyHit =
    /(pecho|estómago|nuca|hombros|mandíbula|mariposas|nudo|tensión|respiración|latidos|chest|stomach|neck|shoulders|jaw|butterflies|knot)/.test(
      txt
    );
  const dontKnow =
    /(no\s+sé|no\s+se|no\s+estoy\s+seguro|no\s+segura|don.?t\s+know|não\s+sei|nao\s+sei|non\s+so)/.test(
      txt
    );
  const causeHit =
    /(porque|por |cuando |al |me dijeron|reunión|plazo|entrega|feedback|discut|pelea|because|when |told me|meeting|deadline|deliver|feedback|argu|perch[ée]|quando |riunion)/.test(
      txt
    );

  const greet = !txt ? T.greet : undefined;

  // RECONOCER
  if (phase === "recognize") {
    if (dontKnow) {
      return {
        eq: {
          phase: "recognize",
          pause: greet || T.thanks,
          questions: [T.askBody, T.askName],
          hints: (LEX[lang] || []).slice(0, 10),
          next_step_hint: T.uNext1,
        },
      };
    }
    if (emotionHit && saidNumber) {
      return {
        eq: {
          phase: "understand",
          pause: greet || T.thanks,
          questions: [T.askCause1, T.askCause2, T.askNeed],
          next_step_hint: T.uNext2,
        },
      };
    }
    if (emotionHit && !saidNumber) {
      return {
        eq: {
          phase: "recognize",
          pause: greet || T.thanks,
          questions: [T.askIntensity, T.askBody],
          hints: (LEX[lang] || []).slice(0, 8),
          next_step_hint: T.uNext1,
        },
      };
    }
    if (bodyHit && !emotionHit) {
      return {
        eq: {
          phase: "recognize",
          pause: greet || T.thanks,
          questions: [T.askName, T.askFamily],
          hints: (LEX[lang] || []).slice(0, 8),
          next_step_hint: T.uNext1,
        },
      };
    }
    return {
      eq: {
        phase: "recognize",
        pause: greet || T.thanks,
        questions: [T.askName, T.askIntensity, T.askFamily],
        hints: (LEX[lang] || []).slice(0, 8),
        next_step_hint: T.uNext1,
      },
    };
  }

  // COMPRENDER
  if (phase === "understand") {
    if (causeHit) {
      return {
        eq: {
          phase: "choose",
          pause: T.thanks,
          questions: [T.choose1, T.choose2, T.choose3],
          next_step_hint: T.chooseEco,
        },
      };
    }
    return {
      eq: {
        phase: "understand",
        pause: T.greet,
        questions: [T.askCause1, T.askCause2, T.askNeed],
        next_step_hint: T.uNext3,
      },
    };
  }

  // ELEGIR
  return {
    eq: {
      phase: "choose",
      pause: T.thanks,
      questions: [T.choose1, T.choose2, T.choose3],
      next_step_hint: T.chooseEco,
    },
  };
}

/* ===================== Plantillas de canal (Rowi mentor/compañero) ===================== */
function draftsByChannel(ch: CoachChannel, goal?: string, name?: string) {
  const who = name ? ` ${name}` : "";
  const g = goal ? ` — ${goal}` : "";
  if (ch === "whatsapp") {
    return {
      primary: `Hola${who}, ¿tienes 2 minutos? Me gustaría alinear${g}. ¿Te parece si te llamo o te envío 3 puntos por aquí?`,
      alt_1: `Hola${who}, ¿podemos coordinar rápido? Propongo 3 puntos clave${g}.`,
      alt_2: `Hola${who}, ¿te viene bien una mini-reunión de 10 min para acordar ${goal || "el siguiente paso"}?`,
    };
  }
  if (ch === "email") {
    return {
      primary: `Asunto: Propuesta breve${g}

Hola${who},

Te comparto 3 puntos para alinear:
1) Objetivo
2) Propuesta concreta
3) Próximo paso y fecha

¿Te parece bien avanzar así? Puedo el [día/hora] o [día/hora].

Gracias,`,
      alt_1: `Asunto: Siguiente paso${g}

Hola${who}, ¿te parece si definimos el próximo paso en 10 min? Propongo 3 puntos y quedamos.`,
      alt_2: `Asunto: Reunión corta${g}

Propongo una mini-reunión de 10 min para cerrar ${goal || "lo pendiente"}.
¿Te viene [día/hora] o [día/hora]?`,
    };
  }
  if (ch === "meeting" || ch === "one_on_one") {
    return {
      primary:
        "Apertura: “Quiero que salgamos con un acuerdo claro.” · Agenda: 1) objetivo, 2) opciones, 3) siguiente paso. · Cierre: “Resumo y propongo fecha de revisión.”",
      alt_1:
        "Checklist: objetivo común → 2–3 opciones → elegir 1 → definir quién/cuándo → seguimiento breve.",
      alt_2:
        "Si hay tensión: valida emoción (“te escucho…”) y vuelve al objetivo.",
    };
  }
  // speech
  return {
    primary:
      "Hook breve → 2 ideas → historia (60s) → llamada a la acción. Manténlo en 2–3 minutos.",
    alt_1: "Estructura: Por qué / Qué / Cómo (1 min cada uno).",
    alt_2: "Cierra con una petición clara (tiempo, acción o decisión).",
  };
}

/* ===================== Coach Affinity (sin números) ===================== */
export function coachAffinity(args: {
  project:
    | "innovation"
    | "execution"
    | "leadership"
    | "conversation"
    | "relationship"
    | "decision"
    | "team";
  channel: CoachChannel;
  goal?: string;
  targetNames: string[];
  shared_strengths?: string[];
  your_edge?: string[];
  their_edge?: string[];
  collab_style?: string;
  understanding_fit?: string;
}): CoachOut {
  const nameList = args.targetNames.join(", ");
  const structure: string[] = [
    `Objetivo: ${args.goal || "alinear el siguiente paso"}`,
    `Apertura con ${nameList}: nombra objetivo común.`,
    `Explora opciones (2–3) y elige 1.`,
    `Define quién hace qué y cuándo.`,
    `Cierra con fecha de revisión.`,
  ];

  const phrases: string[] = [];
  if (args.shared_strengths?.length)
    phrases.push(`Comparten: ${args.shared_strengths.slice(0, 2).join(", ")}`);
  if (args.their_edge?.length)
    phrases.push(`Te complementa en: ${args.their_edge.slice(0, 2).join(", ")}`);
  if (args.collab_style) phrases.push(`Colaboración: ${args.collab_style}`);
  if (args.understanding_fit)
    phrases.push(`Entendimiento: ${args.understanding_fit}`);

  const drafts = draftsByChannel(args.channel, args.goal, args.targetNames[0]);

  return {
    plan: {
      structure,
      drafts,
      phrases,
      eco: null,
      followup: [
        "En 24h: enviar recap de 3 puntos.",
        "En 7 días: revisar avances en 10 min.",
      ],
      notes: [
        "No exponer puntajes de terceros.",
        "Usa preguntas abiertas y valida emoción si hay tensión.",
      ],
    },
  };
}