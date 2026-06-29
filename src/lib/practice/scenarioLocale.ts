/**
 * 🎭 Resolución multi-idioma de un escenario de práctica.
 *
 * Un ScenarioBank es UNA fila con varias traducciones (campo `translations`).
 * Aquí resolvemos la "vista" del escenario en el idioma del usuario, con
 * fallback al idioma base. Puro y testeable: no toca DB.
 */

export type ScenarioLocale = "es" | "en" | "pt" | "it" | "zh";

export const SCENARIO_LOCALES: ScenarioLocale[] = ["es", "en", "pt", "it", "zh"];

/** Etiquetas de rúbrica por clave de criterio, en un idioma. */
export type RubricLabels = Record<string, string>;

/** Una versión de idioma del escenario. */
export interface ScenarioTranslation {
  title: string;
  summary?: string | null;
  brief: string;
  rubricLabels?: RubricLabels;
}

/** El mapa completo de traducciones guardado en `translations`. */
export type ScenarioTranslations = Partial<Record<ScenarioLocale, ScenarioTranslation>>;

/** Forma mínima de un escenario para resolver su vista (subset del modelo). */
export interface ScenarioRecordLike {
  baseLocale?: string | null;
  locale?: string | null;
  title: string;
  summary?: string | null;
  brief: string;
  translations?: unknown;
}

/** Normaliza el JSON arbitrario de `translations` a un mapa tipado. */
export function parseTranslations(raw: unknown): ScenarioTranslations {
  if (!raw || typeof raw !== "object") return {};
  const out: ScenarioTranslations = {};
  for (const loc of SCENARIO_LOCALES) {
    const v = (raw as Record<string, unknown>)[loc];
    if (v && typeof v === "object") {
      const t = v as Partial<ScenarioTranslation>;
      if (typeof t.title === "string" && typeof t.brief === "string") {
        out[loc] = {
          title: t.title,
          summary: typeof t.summary === "string" ? t.summary : null,
          brief: t.brief,
          rubricLabels:
            t.rubricLabels && typeof t.rubricLabels === "object"
              ? (t.rubricLabels as RubricLabels)
              : undefined,
        };
      }
    }
  }
  return out;
}

function isScenarioLocale(x: string | null | undefined): x is ScenarioLocale {
  return !!x && (SCENARIO_LOCALES as string[]).includes(x);
}

/**
 * Devuelve la versión del escenario en `wanted`, cayendo a: idioma base →
 * primera traducción disponible → los campos base de la fila. Nunca null.
 */
export function resolveScenarioView(
  scenario: ScenarioRecordLike,
  wanted: string | null | undefined,
): ScenarioTranslation & { resolvedLocale: ScenarioLocale } {
  const translations = parseTranslations(scenario.translations);
  const base = (isScenarioLocale(scenario.baseLocale)
    ? scenario.baseLocale
    : isScenarioLocale(scenario.locale)
      ? scenario.locale
      : "es") as ScenarioLocale;

  // 1. idioma pedido
  if (isScenarioLocale(wanted) && translations[wanted]) {
    return { ...(translations[wanted] as ScenarioTranslation), resolvedLocale: wanted };
  }
  // 2. idioma base (de translations o de los campos de la fila)
  if (translations[base]) {
    return { ...(translations[base] as ScenarioTranslation), resolvedLocale: base };
  }
  // 3. primera traducción disponible
  for (const loc of SCENARIO_LOCALES) {
    if (translations[loc]) {
      return { ...(translations[loc] as ScenarioTranslation), resolvedLocale: loc };
    }
  }
  // 4. campos base de la fila (compat con datos previos sin translations)
  return {
    title: scenario.title,
    summary: scenario.summary ?? null,
    brief: scenario.brief,
    rubricLabels: undefined,
    resolvedLocale: base,
  };
}

/**
 * Construye/normaliza el objeto `translations` asegurando que el idioma base
 * exista (derivado de los campos de la fila si falta).
 */
export function withBaseTranslation(
  baseLocale: ScenarioLocale,
  baseFields: ScenarioTranslation,
  existing?: ScenarioTranslations,
): ScenarioTranslations {
  return { ...(existing ?? {}), [baseLocale]: baseFields };
}
