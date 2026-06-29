/**
 * 🎭 Traducción IA de un escenario de práctica a los 5 idiomas.
 *
 * Toma la versión base (título, resumen, brief, etiquetas de rúbrica) y produce
 * las traducciones faltantes con `generateText` (motor pluggable, JSON forzado,
 * token-capped). Tolerante: si un idioma falla, se omite (no rompe el guardado).
 */

import { generateText } from "@/lib/ai/generate";
import { resolvePracticeModel, regionFromLocale } from "@/lib/practice/practiceModel";
import {
  SCENARIO_LOCALES,
  type ScenarioLocale,
  type ScenarioTranslation,
  type ScenarioTranslations,
} from "@/lib/practice/scenarioLocale";

const LANG_LABEL: Record<ScenarioLocale, string> = {
  es: "español",
  en: "English",
  pt: "português",
  it: "italiano",
  zh: "中文 (Chinese, simplified)",
};

/** Tope de tokens por idioma traducido (cost-control). */
const TRANSLATE_MAX_TOKENS = 900;

function buildPrompt(
  target: ScenarioLocale,
  base: ScenarioTranslation,
  rubricKeys: string[],
): string {
  const lang = LANG_LABEL[target];
  const labels = rubricKeys.length
    ? `\nrubricLabels: traduce la etiqueta de cada una de estas claves de criterio (NO cambies las claves): ${rubricKeys.join(", ")}`
    : "";
  return [
    `Traduce este escenario de práctica de roleplay al ${lang}. Mantén el tono,`,
    `el registro y la intención. NO inventes contenido nuevo; traduce fielmente.`,
    "",
    `title: ${base.title}`,
    `summary: ${base.summary ?? ""}`,
    `brief: ${base.brief}`,
    labels,
    "",
    `Devuelve SOLO un objeto JSON válido (sin markdown, sin texto extra) con esta forma:`,
    `{"title":"...","summary":"...","brief":"...","rubricLabels":{${rubricKeys
      .map((k) => `"${k}":"..."`)
      .join(",")}}}`,
  ].join("\n");
}

function safeParseJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export interface TranslateInput {
  baseLocale: ScenarioLocale;
  base: ScenarioTranslation;
  /** Idiomas a generar. Default: todos menos el base. */
  targets?: ScenarioLocale[];
  /** Si false, re-traduce aunque ya exista. Default true (no pisa). */
  keepExisting?: boolean;
  existing?: ScenarioTranslations;
}

/**
 * Genera las traducciones del escenario. Siempre incluye el idioma base
 * (copiado tal cual). Nunca lanza: omite idiomas que fallen.
 */
export async function translateScenario(input: TranslateInput): Promise<ScenarioTranslations> {
  const { baseLocale, base } = input;
  const out: ScenarioTranslations = { ...(input.existing ?? {}) };
  // El idioma base es la fuente: se guarda verbatim.
  out[baseLocale] = base;

  const rubricKeys = base.rubricLabels ? Object.keys(base.rubricLabels) : [];
  const targets = (input.targets ?? SCENARIO_LOCALES).filter((l) => l !== baseLocale);
  const keepExisting = input.keepExisting !== false;
  const choice = resolvePracticeModel(null, regionFromLocale(baseLocale));

  for (const target of targets) {
    if (keepExisting && out[target]) continue;
    try {
      const res = await generateText({
        provider: choice.provider,
        model: choice.model,
        system: "Eres un traductor profesional. Respondes únicamente con JSON válido.",
        prompt: buildPrompt(target, base, rubricKeys),
        maxTokens: TRANSLATE_MAX_TOKENS,
        temperature: 0.2,
      });
      const parsed = safeParseJson(res.text) as Partial<ScenarioTranslation> | null;
      if (parsed && typeof parsed.title === "string" && typeof parsed.brief === "string") {
        out[target] = {
          title: parsed.title,
          summary: typeof parsed.summary === "string" ? parsed.summary : null,
          brief: parsed.brief,
          rubricLabels:
            parsed.rubricLabels && typeof parsed.rubricLabels === "object"
              ? (parsed.rubricLabels as Record<string, string>)
              : undefined,
        };
      }
    } catch {
      // Idioma omitido; el resto continúa.
    }
  }
  return out;
}
