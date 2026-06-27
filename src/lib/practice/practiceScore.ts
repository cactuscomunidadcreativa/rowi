/**
 * 🎭 Puntuación + feedback estructurado del AI Practice Partner (3d).
 *
 * Evalúa el intento completo contra la rúbrica del escenario con un solo
 * llamado a `generateText` (mismo motor pluggable que conduce el roleplay),
 * forzando salida JSON. Tolerante a fallos: si la IA no devuelve JSON válido,
 * cae a un puntaje neutro con feedback genérico (la sesión nunca se rompe).
 */

import { generateText, type AIProvider } from "@/lib/ai/generate";
import { PRACTICE_SCORE_MAX_TOKENS, type TurnForPrompt } from "@/lib/practice/practiceEngine";
import {
  parseRubric,
  clamp0100,
  weightedOverall,
  type PracticeRubric,
  type CriterionScore,
  type PracticeFeedback,
} from "@/lib/practice/practiceRubric";

// Re-export para mantener la superficie de import estable (route + tests).
export { parseRubric };
export type {
  RubricCriterion,
  PracticeRubric,
  CriterionScore,
  PracticeFeedback,
} from "@/lib/practice/practiceRubric";

const LANG_LABEL: Record<string, string> = {
  es: "español",
  en: "English",
  pt: "português",
  it: "italiano",
  zh: "中文 (Chinese)",
};

/** Construye el prompt de evaluación a partir del transcript y la rúbrica. */
function buildScorePrompt(
  scenarioTitle: string,
  brief: string,
  rubric: PracticeRubric,
  transcript: TurnForPrompt[],
  locale: string,
): string {
  const lang = LANG_LABEL[locale] ?? LANG_LABEL.es;
  const convo = transcript
    .map((t) => `${t.role === "USER" ? "Persona" : "Personaje"}: ${t.content}`)
    .join("\n");
  const criteriaList = rubric.criteria
    .map((c) => `- ${c.key}: ${c.label}`)
    .join("\n");
  return [
    `Evalúa el desempeño de "Persona" en esta práctica de conversación.`,
    `Escenario: ${scenarioTitle}`,
    `Contexto: ${brief}`,
    "",
    "Criterios (key: descripción):",
    criteriaList,
    "",
    "Conversación:",
    convo,
    "",
    `Devuelve SOLO un objeto JSON válido (sin texto extra, sin markdown) en ${lang}, con esta forma:`,
    `{"summary": "...", "strengths": ["..."], "improvements": ["..."],`,
    ` "criteria": [{"key": "<key>", "score": <0-100>, "comment": "..."}]}`,
    "Incluye exactamente un objeto por cada criterio listado. Sé concreto y útil.",
  ].join("\n");
}

function safeParseJson(text: string): unknown {
  // Extrae el primer bloque {...} por si el modelo envuelve en prosa/markdown.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export interface ScoreInput {
  scenarioTitle: string;
  brief: string;
  rubric: PracticeRubric;
  transcript: TurnForPrompt[];
  locale: string;
  provider: AIProvider;
  model: string;
}

/** Puntúa el intento. Nunca lanza: devuelve un feedback válido siempre. */
export async function scorePracticeSession(input: ScoreInput): Promise<PracticeFeedback> {
  const neutralCriteria: CriterionScore[] = input.rubric.criteria.map((c) => ({
    key: c.key,
    label: c.label,
    score: 60,
    comment: "",
  }));
  const neutral: PracticeFeedback = {
    overall: 60,
    summary: "",
    criteria: neutralCriteria,
    strengths: [],
    improvements: [],
  };

  try {
    const result = await generateText({
      provider: input.provider,
      model: input.model,
      system:
        "Eres un evaluador EQ de Six Seconds. Eres riguroso, justo y específico. " +
        "Respondes únicamente con JSON válido.",
      prompt: buildScorePrompt(
        input.scenarioTitle,
        input.brief,
        input.rubric,
        input.transcript,
        input.locale,
      ),
      maxTokens: PRACTICE_SCORE_MAX_TOKENS,
      temperature: 0.3,
    });
    const parsed = safeParseJson(result.text) as
      | {
          summary?: string;
          strengths?: string[];
          improvements?: string[];
          criteria?: Array<{ key?: string; score?: number; comment?: string }>;
        }
      | null;
    if (!parsed) return neutral;

    const criteria: CriterionScore[] = input.rubric.criteria.map((rc) => {
      const match = parsed.criteria?.find((c) => c.key === rc.key);
      return {
        key: rc.key,
        label: rc.label,
        score: clamp0100(match?.score),
        comment: typeof match?.comment === "string" ? match.comment : "",
      };
    });
    return {
      overall: weightedOverall(criteria, input.rubric),
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      criteria,
      strengths: Array.isArray(parsed.strengths)
        ? parsed.strengths.filter((s): s is string => typeof s === "string").slice(0, 5)
        : [],
      improvements: Array.isArray(parsed.improvements)
        ? parsed.improvements.filter((s): s is string => typeof s === "string").slice(0, 5)
        : [],
    };
  } catch {
    return neutral;
  }
}
