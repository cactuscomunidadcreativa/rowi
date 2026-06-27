/**
 * 🎭 Tipos + parser de la rúbrica de práctica (puro, sin IA/DB).
 *
 * Separado de practiceScore.ts (que llama a la IA) para que la lógica pura sea
 * testeable sin arrastrar los SDKs de OpenAI/Anthropic en el import.
 */

/** Un criterio de la rúbrica del escenario. */
export interface RubricCriterion {
  key: string;
  label: string;
  /** Peso relativo (se normaliza). Default 1. */
  weight?: number;
}

export interface PracticeRubric {
  criteria: RubricCriterion[];
}

export interface CriterionScore {
  key: string;
  label: string;
  score: number; // 0-100
  comment: string;
}

export interface PracticeFeedback {
  overall: number; // 0-100 ponderado
  summary: string;
  criteria: CriterionScore[];
  strengths: string[];
  improvements: string[];
}

/** Normaliza/valida una rúbrica arbitraria (viene de JSON en DB). */
export function parseRubric(raw: unknown): PracticeRubric {
  const fallback: PracticeRubric = {
    criteria: [
      { key: "empathy", label: "Empatía y escucha", weight: 1 },
      { key: "clarity", label: "Claridad y asertividad", weight: 1 },
      { key: "outcome", label: "Avance hacia el objetivo", weight: 1 },
    ],
  };
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as { criteria?: unknown };
  if (!Array.isArray(obj.criteria) || obj.criteria.length === 0) return fallback;
  const criteria: RubricCriterion[] = [];
  for (const c of obj.criteria) {
    if (c && typeof c === "object" && typeof (c as RubricCriterion).key === "string") {
      const cc = c as RubricCriterion;
      criteria.push({ key: cc.key, label: cc.label ?? cc.key, weight: cc.weight ?? 1 });
    }
  }
  return criteria.length > 0 ? { criteria } : fallback;
}

export function clamp0100(n: unknown): number {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function weightedOverall(criteria: CriterionScore[], rubric: PracticeRubric): number {
  let totalW = 0;
  let acc = 0;
  for (const cs of criteria) {
    const w = rubric.criteria.find((r) => r.key === cs.key)?.weight ?? 1;
    totalW += w;
    acc += cs.score * w;
  }
  return totalW > 0 ? Math.round(acc / totalW) : 0;
}
