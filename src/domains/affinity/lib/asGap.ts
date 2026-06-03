/**
 * Afinidad como BRECHA — capa de presentación sobre los motores de afinidad.
 *
 * Regla dura SIA: la afinidad es la BRECHA entre dos estilos que SE CIERRA,
 * NUNCA un veredicto de compatibilidad ("incompatibles" / "85% compatible" están
 * prohibidos). En vez de un %, exponemos una escala cualitativa de SINTONÍA
 * (metáfora de señal de radio: algo que se ajusta, no un juicio fijo) + un nivel
 * 0-3 para una barra/termómetro que "se llena" hacia la sintonía.
 *
 * No toca el cálculo de los motores /api/affinity/* — solo reinterpreta su salida.
 */

/** Los 4 niveles de la escala de Sintonía (de menos a más cercanía de estilos). */
export type AttunementLevel = "searching" | "tuning" | "inSync" | "connected";

/** Claves i18n de cada nivel (la UI las localiza en es/en/pt/it). */
export const ATTUNEMENT_I18N: Record<AttunementLevel, string> = {
  searching: "affinity.attunement.searching", // Buscando señal
  tuning: "affinity.attunement.tuning", // Sintonizando
  inSync: "affinity.attunement.inSync", // En sintonía
  connected: "affinity.attunement.connected", // Conectados
};

/** Hint de puente por nivel (acción, no veredicto). Clave i18n. */
export const ATTUNEMENT_HINT_I18N: Record<AttunementLevel, string> = {
  searching: "affinity.attunement.hint.searching",
  tuning: "affinity.attunement.hint.tuning",
  inSync: "affinity.attunement.hint.inSync",
  connected: "affinity.attunement.hint.connected",
};

export interface AttunementGap {
  level: AttunementLevel;
  /** 0-3 para la barra/termómetro (searching=0 … connected=3). */
  step: number;
  /** Clave i18n de la etiqueta del nivel. */
  labelKey: string;
  /** Clave i18n del hint de puente. */
  hintKey: string;
}

const ORDER: AttunementLevel[] = ["searching", "tuning", "inSync", "connected"];

function levelFromUnit(unit: number): AttunementLevel {
  // unit en [0,1]. Cuartiles → 4 niveles.
  if (unit < 0.25) return "searching";
  if (unit < 0.5) return "tuning";
  if (unit < 0.75) return "inSync";
  return "connected";
}

export interface AffinityGapInput {
  /** Heat afinidad en escala 1-135 (fuente preferida). */
  heat135?: number | null;
  /** Heat normalizado 0-100 (fallback). */
  heat100?: number | null;
  /** Compatibilidad legacy 0-100 (último fallback; se reinterpreta, no se muestra). */
  compatibility?: number | null;
}

/**
 * Convierte la salida de afinidad en la escala de Sintonía. Determinista, puro.
 * Devuelve null si no hay ninguna señal numérica (la UI muestra "sin datos").
 */
export function affinityAsGap(input: AffinityGapInput): AttunementGap | null {
  let unit: number | null = null;

  if (typeof input.heat135 === "number" && Number.isFinite(input.heat135)) {
    // 1-135 → 0-1 (1 es el piso de la escala Six Seconds).
    unit = (input.heat135 - 1) / (135 - 1);
  } else if (typeof input.heat100 === "number" && Number.isFinite(input.heat100)) {
    unit = input.heat100 / 100;
  } else if (typeof input.compatibility === "number" && Number.isFinite(input.compatibility)) {
    unit = input.compatibility / 100;
  }

  if (unit === null) return null;
  unit = Math.min(1, Math.max(0, unit));

  const level = levelFromUnit(unit);
  return {
    level,
    step: ORDER.indexOf(level),
    labelKey: ATTUNEMENT_I18N[level],
    hintKey: ATTUNEMENT_HINT_I18N[level],
  };
}
