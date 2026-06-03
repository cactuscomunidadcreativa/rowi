/**
 * Mapeo DETERMINISTA (sin IA) del resultado del mini-SEI "Rowi Test" a un
 * borrador de CommunicationProfile ("cómo me comunico" / "cómo quiero que me
 * hablen"). Reencuadre SIA: el mini-SEI va BAJO EL CAPÓ — esto produce el
 * borrador editable del Perfil, NUNCA un score/arquetipo visible.
 *
 * Guarda CLAVES i18n (no texto literal) para que la UI localice en es/en/pt/it.
 * El usuario luego edita; al editar se marca editedAt y no se vuelve a sembrar.
 */
import type { PreSeiResult } from "@/lib/pre-sei/scoring";
import type { SeiKey } from "@/lib/vital-signs/catalog";

export interface CommProfileDraft {
  commSelf: string[]; // claves i18n de frases "cómo me comunico"
  commPref: string[]; // claves i18n de frases "cómo quiero que me hablen"
  tone: string; // tono base (clave i18n corta)
  archetype: string; // cuadrante (bajo el capó)
  activates: string[];
  drains: string[];
}

type Band = "low" | "mid" | "high";

function band(score: number): Band {
  if (score < 90) return "low";
  if (score >= 110) return "high";
  return "mid";
}

/**
 * Reglas por competencia: qué frase de "cómo me comunico" / "cómo prefiero que
 * me hablen" aporta cada competencia cuando está alta o baja. Solo las señales
 * marcadas (high/low) contribuyen; mid no añade ruido. Claves i18n bajo
 * `profile.comm.*` (la UI las resuelve).
 */
const RULES: Partial<
  Record<SeiKey, { high?: { self?: string; pref?: string }; low?: { self?: string; pref?: string } }>
> = {
  EL: {
    high: { self: "profile.comm.self.EL.high" }, // nombro bien lo que siento
    low: { pref: "profile.comm.pref.EL.low" }, // dame espacio para procesar
  },
  ACT: {
    high: { self: "profile.comm.self.ACT.high" }, // voy al grano / pienso consecuencias
    low: { pref: "profile.comm.pref.ACT.low" }, // dame contexto antes del pedido
  },
  NE: {
    high: { self: "profile.comm.self.NE.high" }, // mantengo la calma en tensión
    low: { pref: "profile.comm.pref.NE.low" }, // cuida el tono cuando hay carga
  },
  IM: {
    high: { self: "profile.comm.self.IM.high" }, // me mueve el porqué propio
    low: { pref: "profile.comm.pref.IM.low" }, // ayúdame a ver el sentido
  },
  OP: {
    high: { self: "profile.comm.self.OP.high" }, // veo posibilidades
  },
  EMP: {
    high: { self: "profile.comm.self.EMP.high", pref: "profile.comm.pref.EMP.high" },
    low: { pref: "profile.comm.pref.EMP.low" }, // dime explícito cómo te sientes
  },
  NG: {
    high: { self: "profile.comm.self.NG.high" }, // conecto con algo más grande
  },
};

/** Tono base derivado del cuadrante dominante (clave i18n). */
const TONE_BY_QUADRANT: Record<string, string> = {
  LINTERNA: "profile.comm.tone.direct",
  MAPA: "profile.comm.tone.warm",
  BOTIQUIN: "profile.comm.tone.caring",
  BOTAS: "profile.comm.tone.practical",
  BALANCED: "profile.comm.tone.balanced",
};

/**
 * Produce el borrador determinista desde el PreSeiResult. Puro y testeable.
 */
export function commProfileFromPreSei(result: PreSeiResult): CommProfileDraft {
  const commSelf: string[] = [];
  const commPref: string[] = [];

  for (const [key, score] of Object.entries(result.competencies) as [SeiKey, number][]) {
    const rule = RULES[key];
    if (!rule) continue;
    const b = band(score);
    const hit = b === "high" ? rule.high : b === "low" ? rule.low : undefined;
    if (hit?.self) commSelf.push(hit.self);
    if (hit?.pref) commPref.push(hit.pref);
  }

  const quadrant = result.archetype.quadrant;
  const tone = TONE_BY_QUADRANT[quadrant] ?? TONE_BY_QUADRANT.BALANCED;

  // "activates/drains": derivados de los top/bottom pulse points (clave + nombre).
  const sorted = [...result.topPulsePoints];
  const activates = sorted.slice(0, 2).map((pp) => pp.code);

  return {
    commSelf,
    commPref,
    tone,
    archetype: quadrant,
    activates,
    drains: [],
  };
}
