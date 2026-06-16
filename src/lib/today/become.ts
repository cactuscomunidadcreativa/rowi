/**
 * Motor BECOME (determinista) — "tu mejor versión hoy".
 *
 * El sistema PROPONE una identidad y una sola práctica, no el usuario elige de
 * un menú (arquitectura: el loop BECOME → PRACTICE). La propuesta sale del
 * perfil EQ del usuario SIN llamar a IA (cost-control: cero tokens):
 *  - foco = la competencia SEI con mayor oportunidad (score más bajo)
 *  - si no hay perfil, rota por (dayOfYear % 8) como el Daily Pulse
 *
 * Vocabulario coherente con `src/lib/daily-pulse/questions.ts` (mismas 8 SEI).
 */
import type { SeiKey } from "@/lib/vital-signs/catalog";
import { SEI_ORDER } from "@/lib/daily-pulse/questions";
import { localDayOfYear } from "@/lib/daily-pulse/timezone";

export type BecomeLang = "es" | "en" | "pt" | "it";

interface LocalizedText {
  es: string;
  en: string;
  pt: string;
  it: string;
}

interface BecomeProposal {
  /** "tu mejor versión hoy" — la identidad propuesta. */
  identity: LocalizedText;
  /** una sola práctica concreta para hoy. */
  practice: LocalizedText;
}

/** Identidad + práctica por competencia SEI. Determinista, editable, sin IA. */
const BECOME_BY_SEI: Record<SeiKey, BecomeProposal> = {
  EL: {
    identity: {
      es: "Hoy puedes ser alguien que nombra lo que siente antes de actuar.",
      en: "Today you can be someone who names what they feel before acting.",
      pt: "Hoje você pode ser alguém que nomeia o que sente antes de agir.",
      it: "Oggi puoi essere qualcuno che dà un nome a ciò che sente prima di agire.",
    },
    practice: {
      es: "Antes de tu próxima reacción, ponle nombre exacto a la emoción.",
      en: "Before your next reaction, give the emotion its exact name.",
      pt: "Antes da sua próxima reação, dê à emoção seu nome exato.",
      it: "Prima della tua prossima reazione, dai all'emozione il suo nome esatto.",
    },
  },
  RP: {
    identity: {
      es: "Hoy puedes ser alguien que ve sus patrones en vez de repetirlos.",
      en: "Today you can be someone who sees their patterns instead of repeating them.",
      pt: "Hoje você pode ser alguém que vê seus padrões em vez de repeti-los.",
      it: "Oggi puoi essere qualcuno che vede i propri schemi invece di ripeterli.",
    },
    practice: {
      es: "Nota una reacción tuya de hoy y pregúntate: ¿esto ya me pasó antes?",
      en: "Notice one of your reactions today and ask: has this happened before?",
      pt: "Note uma reação sua de hoje e pergunte: isso já aconteceu antes?",
      it: "Nota una tua reazione di oggi e chiediti: mi è già successo prima?",
    },
  },
  ACT: {
    identity: {
      es: "Hoy puedes ser alguien que responde en vez de reaccionar.",
      en: "Today you can be someone who responds instead of reacting.",
      pt: "Hoje você pode ser alguém que responde em vez de reagir.",
      it: "Oggi puoi essere qualcuno che risponde invece di reagire.",
    },
    practice: {
      es: "Antes de una decisión importante hoy, haz una pausa de seis segundos.",
      en: "Before an important decision today, take a six-second pause.",
      pt: "Antes de uma decisão importante hoje, faça uma pausa de seis segundos.",
      it: "Prima di una decisione importante oggi, fai una pausa di sei secondi.",
    },
  },
  NE: {
    identity: {
      es: "Hoy puedes ser alguien que se queda con una emoción difícil sin huir.",
      en: "Today you can be someone who stays with a hard emotion without fleeing.",
      pt: "Hoje você pode ser alguém que permanece com uma emoção difícil sem fugir.",
      it: "Oggi puoi essere qualcuno che resta con un'emozione difficile senza fuggire.",
    },
    practice: {
      es: "Cuando llegue una emoción incómoda, respírala 10 segundos antes de actuar.",
      en: "When an uncomfortable emotion arrives, breathe with it 10 seconds before acting.",
      pt: "Quando chegar uma emoção incômoda, respire com ela 10 segundos antes de agir.",
      it: "Quando arriva un'emozione scomoda, respirala 10 secondi prima di agire.",
    },
  },
  IM: {
    identity: {
      es: "Hoy puedes ser alguien que actúa desde un por qué propio.",
      en: "Today you can be someone who acts from a why of their own.",
      pt: "Hoje você pode ser alguém que age a partir de um porquê próprio.",
      it: "Oggi puoi essere qualcuno che agisce da un perché tuo.",
    },
    practice: {
      es: "Elige una tarea de hoy y conéctala con algo que de verdad te importa.",
      en: "Pick one of today's tasks and connect it to something you truly care about.",
      pt: "Escolha uma tarefa de hoje e conecte-a com algo que realmente importa a você.",
      it: "Scegli un compito di oggi e collegalo a qualcosa che ti sta davvero a cuore.",
    },
  },
  OP: {
    identity: {
      es: "Hoy puedes ser alguien que ve posibilidad sin negar la realidad.",
      en: "Today you can be someone who sees possibility without denying reality.",
      pt: "Hoje você pode ser alguém que vê possibilidade sem negar a realidade.",
      it: "Oggi puoi essere qualcuno che vede possibilità senza negare la realtà.",
    },
    practice: {
      es: "Frente a algo que te preocupa, lista tres salidas posibles, no solo la peor.",
      en: "Facing something worrying, list three possible outcomes, not just the worst.",
      pt: "Diante de algo que lhe preocupa, liste três saídas possíveis, não só a pior.",
      it: "Davanti a qualcosa che ti preoccupa, elenca tre esiti possibili, non solo il peggiore.",
    },
  },
  EMP: {
    identity: {
      es: "Hoy puedes ser alguien que se detiene a sentir lo que el otro siente.",
      en: "Today you can be someone who pauses to feel what another feels.",
      pt: "Hoje você pode ser alguém que para para sentir o que o outro sente.",
      it: "Oggi puoi essere qualcuno che si ferma a sentire ciò che l'altro prova.",
    },
    practice: {
      es: "En tu próxima conversación, escucha sin preparar tu respuesta ni arreglar nada.",
      en: "In your next conversation, listen without preparing your reply or fixing anything.",
      pt: "Na sua próxima conversa, escute sem preparar sua resposta nem consertar nada.",
      it: "Nella tua prossima conversazione, ascolta senza preparare la risposta né risolvere nulla.",
    },
  },
  NG: {
    identity: {
      es: "Hoy puedes ser alguien que actúa al servicio de algo más grande.",
      en: "Today you can be someone who acts in service of something bigger.",
      pt: "Hoje você pode ser alguém que age a serviço de algo maior.",
      it: "Oggi puoi essere qualcuno che agisce al servizio di qualcosa di più grande.",
    },
    practice: {
      es: "Haz una cosa hoy que conecte con el propósito que quieres dejar en el mundo.",
      en: "Do one thing today that connects to the purpose you want to leave in the world.",
      pt: "Faça uma coisa hoje que conecte com o propósito que você quer deixar no mundo.",
      it: "Fai una cosa oggi che si colleghi allo scopo che vuoi lasciare nel mondo.",
    },
  },
};

/** Perfil de competencias EQ (cualquier escala numérica; menor = más oportunidad). */
export type CompetencyProfile = Partial<Record<SeiKey, number | null | undefined>>;

/**
 * Elige la competencia foco del día. Determinista:
 *  - con perfil: la competencia con el score más bajo (mayor oportunidad de crecer)
 *  - sin perfil: rota por (dayOfYear local) % 8, igual que el Daily Pulse
 * El empate se rompe por el orden canónico SEI_ORDER (estable).
 */
export function pickFocusSei(
  profile: CompetencyProfile | null | undefined,
  now: Date = new Date(),
  tzOffsetMinutes = 0
): SeiKey {
  const scored = SEI_ORDER.map((sei) => ({ sei, score: profile?.[sei] }))
    .filter((x) => typeof x.score === "number" && Number.isFinite(x.score)) as {
    sei: SeiKey;
    score: number;
  }[];

  if (scored.length > 0) {
    scored.sort((a, b) => a.score - b.score);
    return scored[0].sei;
  }

  const dayOfYear = localDayOfYear(now, tzOffsetMinutes);
  return SEI_ORDER[dayOfYear % SEI_ORDER.length];
}

/**
 * Señal de un día reciente del loop (subconjunto de DailyLoopEntry) que sirve
 * para que la reflexión de ayer influya en la propuesta de hoy. Hasta ahora el
 * foco salía SOLO del perfil EQ estático: lo que el usuario practicaba (o no)
 * cada día no realimentaba el siguiente ciclo (Today escribía memoria, Becoming
 * la mostraba, pero la memoria no cerraba el loop hacia la propuesta de mañana).
 */
export interface RecentLoopSignal {
  becomeSei: string | null;
  practiceDone: boolean;
}

/**
 * Ajusta el foco del día con la memoria reciente del loop. Regla determinista,
 * sin IA: si en los últimos días el sistema propuso una competencia y el usuario
 * NO completó su práctica, esa competencia sigue siendo la oportunidad real —
 * el sistema PERSISTE en ese foco en vez de saltar mecánicamente al siguiente
 * score más bajo. Solo "suelta" el foco cuando hubo una práctica hecha (señal de
 * que el usuario ya está trabajando ahí) o cuando no hay historia.
 *
 * Conservador: si las señales no apuntan a una SEI válida, cae al foco base.
 */
export function pickFocusWithMemory(
  baseFocus: SeiKey,
  recent: RecentLoopSignal[] | null | undefined
): SeiKey {
  if (!recent || recent.length === 0) return baseFocus;

  // Foco propuesto más reciente con práctica NO hecha = oportunidad sin cerrar.
  for (const day of recent) {
    const sei = day.becomeSei;
    if (!sei || !isSeiKey(sei)) continue;
    // Si ya la trabajó (práctica hecha), no insistir: deja que el perfil decida.
    if (day.practiceDone) break;
    return sei;
  }
  return baseFocus;
}

function isSeiKey(v: string): v is SeiKey {
  return v in BECOME_BY_SEI;
}

/** Devuelve la propuesta BECOME (identidad + práctica) para una competencia. */
export function proposeBecoming(
  sei: SeiKey,
  lang: BecomeLang
): { sei: SeiKey; identity: string; practice: string } {
  const p = BECOME_BY_SEI[sei];
  return {
    sei,
    identity: p.identity[lang] ?? p.identity.es,
    practice: p.practice[lang] ?? p.practice.es,
  };
}

/** Atajo: propone directamente desde el perfil EQ. */
export function proposeBecomingFromProfile(
  profile: CompetencyProfile | null | undefined,
  lang: BecomeLang,
  now: Date = new Date(),
  tzOffsetMinutes = 0
): { sei: SeiKey; identity: string; practice: string } {
  const sei = pickFocusSei(profile, now, tzOffsetMinutes);
  return proposeBecoming(sei, lang);
}

/**
 * Como `proposeBecomingFromProfile`, pero deja que la MEMORIA reciente del loop
 * (las últimas reflexiones/prácticas) influya en el foco: cierra el lazo
 * Today → Becoming → Today. El perfil EQ da el foco base; la práctica no
 * completada de días recientes lo mantiene hasta que el usuario avance ahí.
 */
export function proposeBecomingFromProfileAndMemory(
  profile: CompetencyProfile | null | undefined,
  recent: RecentLoopSignal[] | null | undefined,
  lang: BecomeLang,
  now: Date = new Date(),
  tzOffsetMinutes = 0
): { sei: SeiKey; identity: string; practice: string } {
  const base = pickFocusSei(profile, now, tzOffsetMinutes);
  const sei = pickFocusWithMemory(base, recent);
  return proposeBecoming(sei, lang);
}
