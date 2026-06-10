/**
 * Capa de PREFERENCIAS del mini-SEI — "qué tipo de persona soy", no "cuánto EQ
 * tengo". El mini-SEI da el Total EQ normado; estas preguntas capturan el ESTILO
 * que ECO/Afinidad necesitan para personalizar el puente conversacional.
 *
 * Decisión Eduardo (2026-06-09): pocas preguntas, capciosas (situacionales, no
 * "¿eres analítico?" directo), con ESCALA 1-5 para extrapolar cuán al extremo de
 * cada eje está la persona (1 = extremo izquierdo, 3 = balanceado, 5 = extremo
 * derecho). Alimentan exactamente lo que ECO consume: prefers / tone / dataStyle
 * / channels.
 *
 * El texto vive en i18n (`miniSei.pref.*`); aquí solo la estructura y el mapeo
 * determinista (sin IA) a las dimensiones de ECO.
 */

/** Los 4 ejes de preferencia. left = polo 1, right = polo 5. */
export type PrefAxis = "processing" | "change" | "horizon" | "channel";

export interface PrefAxisDef {
  axis: PrefAxis;
  /** Clave i18n del enunciado capcioso (situacional). */
  promptKey: string;
  /** Etiqueta del polo izquierdo (valor 1) y derecho (valor 5), claves i18n. */
  leftKey: string;
  rightKey: string;
}

/**
 * Orden estable de los ejes. El cliente responde por POSICIÓN (igual que el
 * mini-SEI): el orden de PREF_AXES ES el contrato con la UI y el submit.
 */
export const PREF_AXES: PrefAxisDef[] = [
  {
    axis: "processing",
    promptKey: "miniSei.pref.processing.prompt", // "Un colega te trae un problema. Tu instinto primero…"
    leftKey: "miniSei.pref.processing.left", // pido los datos
    rightKey: "miniSei.pref.processing.right", // pregunto cómo se siente
  },
  {
    axis: "change",
    promptKey: "miniSei.pref.change.prompt", // "Te proponen cambiar algo que funcionaba…"
    leftKey: "miniSei.pref.change.left", // me entusiasma probar
    rightKey: "miniSei.pref.change.right", // pido pruebas antes de moverme
  },
  {
    axis: "horizon",
    promptKey: "miniSei.pref.horizon.prompt", // "Eliges un plan…"
    leftKey: "miniSei.pref.horizon.left", // resultados esta semana
    rightKey: "miniSei.pref.horizon.right", // rinde en un año
  },
  {
    axis: "channel",
    promptKey: "miniSei.pref.channel.prompt", // "Para algo importante prefieres…"
    leftKey: "miniSei.pref.channel.left", // una llamada ahora
    rightKey: "miniSei.pref.channel.right", // un mensaje que pueda pensar
  },
];

/** Respuestas por posición opaca: { "0": 1..5, "1": 1..5, ... }. */
export type PrefAnswers = Record<string, number>;

/** Preferencias resueltas, escala 1-5 por eje (3 = balanceado). null = sin responder. */
export interface ResolvedPreferences {
  processing: number | null; // 1 analítico ↔ 5 emocional
  change: number | null; // 1 abierto ↔ 5 reticente
  horizon: number | null; // 1 corto plazo ↔ 5 largo plazo
  channel: number | null; // 1 síncrono ↔ 5 asíncrono
}

/** Mapea respuestas posicionales → preferencias por eje (1-5, validado). */
export function resolvePreferences(answers: PrefAnswers): ResolvedPreferences {
  const out: ResolvedPreferences = {
    processing: null,
    change: null,
    horizon: null,
    channel: null,
  };
  PREF_AXES.forEach((def, i) => {
    const raw = answers[String(i)];
    if (typeof raw === "number" && raw >= 1 && raw <= 5) {
      out[def.axis] = raw;
    }
  });
  return out;
}

/**
 * Forma que ECO/Afinidad consumen del perfil declarado. Strings cortos y claves
 * i18n; el motor las funde con lo inferido del brain style (no las reemplaza).
 */
export interface DeclaredCommStyle {
  /** clave i18n del "prefers" declarado (qué le gusta recibir). */
  prefersKey: string | null;
  /** clave i18n del tono base declarado. */
  toneKey: string | null;
  /** clave i18n del estilo de datos (corto/largo plazo). */
  dataStyleKey: string | null;
  /** canal preferido ordenado (sync primero o async primero). */
  channels: string[];
  /** intensidad 0-1 de cuán marcada está la preferencia (|valor-3|/2). */
  intensity: Record<PrefAxis, number>;
}

/** |v-3|/2 → 0 (balanceado) .. 1 (extremo). null → 0. */
function axisIntensity(v: number | null): number {
  if (v == null) return 0;
  return Math.abs(v - 3) / 2;
}

/**
 * Traduce las preferencias 1-5 a las dimensiones que ECO usa. Determinista, sin
 * IA. Solo emite una señal cuando la preferencia NO es balanceada (≠3); el polo
 * (left/right) decide la clave. Esto evita ruido: un 3 no aporta sesgo.
 */
export function declaredCommStyle(prefs: ResolvedPreferences): DeclaredCommStyle {
  const lean = (v: number | null): "left" | "right" | null =>
    v == null || v === 3 ? null : v < 3 ? "left" : "right";

  const processing = lean(prefs.processing);
  const change = lean(prefs.change);
  const horizon = lean(prefs.horizon);
  const channel = lean(prefs.channel);

  // prefers: analítico (datos) vs emocional (personas).
  const prefersKey =
    processing === "left"
      ? "miniSei.pref.derived.prefers.analytic"
      : processing === "right"
        ? "miniSei.pref.derived.prefers.emotional"
        : null;

  // tono: abierto al cambio = inspirador; reticente = cauto/confiable.
  const toneKey =
    change === "left"
      ? "miniSei.pref.derived.tone.open"
      : change === "right"
        ? "miniSei.pref.derived.tone.cautious"
        : null;

  // dataStyle: corto plazo = resultados ya; largo plazo = visión sostenida.
  const dataStyleKey =
    horizon === "left"
      ? "miniSei.pref.derived.data.short"
      : horizon === "right"
        ? "miniSei.pref.derived.data.long"
        : null;

  // canales: síncrono (call/voice) primero o asíncrono (text) primero.
  const channels =
    channel === "left"
      ? ["call", "speech", "whatsapp", "email"]
      : channel === "right"
        ? ["email", "whatsapp", "sms", "call"]
        : [];

  return {
    prefersKey,
    toneKey,
    dataStyleKey,
    channels,
    intensity: {
      processing: axisIntensity(prefs.processing),
      change: axisIntensity(prefs.change),
      horizon: axisIntensity(prefs.horizon),
      channel: axisIntensity(prefs.channel),
    },
  };
}
