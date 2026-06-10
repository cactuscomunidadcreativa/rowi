/**
 * El primer escritor del FOSO causal (Knowledge Layer).
 *
 * Hasta hoy los modelos Intervention / InterventionOutcome existían pero NUNCA
 * recibían un insert — la tesis "no midas emociones, mide el convertirse" era
 * narrativa sin datos. Aquí empezamos a llenarlos desde el loop diario.
 *
 * HONESTIDAD sobre lo que esto ES y NO es:
 * - La práctica diaria entrena una competencia SEI (becomeSei). Es una
 *   `Intervention` de tipo "practice".
 * - El par before/after que capturamos es una señal de ADHERENCIA + ESTADO
 *   auto-reportado (morningIntensity al abrir el día → completar práctica +
 *   reflexión al cerrarlo). NO es un efecto causal calibrado: por eso la
 *   intervención nace como `hypothesis_v0` / confidence "low". El valor del
 *   foso es acumular PARES REALES que luego se calibran contra SEI/VS real.
 * - userId se guarda para poder agregar por persona; el dataset exporter puede
 *   anonimizarlo (userId null = agregado).
 *
 * Resiliente: cualquier fallo aquí NUNCA debe romper el guardado del loop.
 */
import { prisma } from "@/core/prisma";

/** SeiKey → outcome objetivo del modelo Six Seconds (hipótesis v0). */
const SEI_TO_OUTCOME: Record<string, string> = {
  EL: "effectiveness", // Enhance Emotional Literacy
  RP: "effectiveness", // Recognize Patterns
  ACT: "wellbeing", // Apply Consequential Thinking
  NE: "wellbeing", // Navigate Emotions
  IM: "quality_of_life", // Engage Intrinsic Motivation
  OP: "quality_of_life", // Exercise Optimism
  EMP: "relationships", // Increase Empathy
  NG: "quality_of_life", // Pursue Noble Goals
};

/** Estado auto-reportado 1-5 → escala 0-100 (señal de adherencia/estado). */
function intensityToScore(intensity: number | null | undefined): number | null {
  if (typeof intensity !== "number" || intensity < 1 || intensity > 5) return null;
  return Math.round(((intensity - 1) / 4) * 100);
}

/**
 * Registra el par Intervention → InterventionOutcome al cerrar el loop diario.
 * Llamar SOLO cuando la reflexión se completó (el cierre del día).
 *
 * @returns el id del outcome escrito, o null si no había señal suficiente / falló.
 */
export async function recordDailyIntervention(params: {
  userId: string;
  becomeSei: string | null;
  practiceText: string | null;
  practiceDone: boolean;
  morningIntensity: number | null;
}): Promise<string | null> {
  try {
    const sei = params.becomeSei;
    if (!sei) return null; // sin competencia foco no hay intervención que medir

    const targetOutcome = SEI_TO_OUTCOME[sei] ?? "effectiveness";

    // 1. Catálogo: una Intervention por competencia foco del daily loop.
    //    upsert por `key` única → idempotente, se reusa entre usuarios y días.
    const key = `daily_practice_${sei}`;
    const intervention = await prisma.intervention.upsert({
      where: { key },
      create: {
        key,
        kind: "practice",
        title: `Práctica diaria · ${sei}`,
        description: "Micro-práctica del loop diario que entrena la competencia foco.",
        targetOutcome,
        targetComp: sei,
        effectSource: "hypothesis_v0",
        confidence: "low",
      },
      update: {}, // el catálogo no cambia al usarse; la calibración va aparte
      select: { id: true },
    });

    // 2. Outcome: el par before/after de ESTA persona en ESTE día.
    //    before = estado al abrir el día; after = before + señal de adherencia
    //    (completar la práctica). Honesto: es adherencia+estado, no efecto causal.
    const before = intensityToScore(params.morningIntensity);
    const after =
      before != null
        ? Math.min(100, before + (params.practiceDone ? 10 : 0))
        : null;
    const delta = before != null && after != null ? after - before : null;

    const outcome = await prisma.interventionOutcome.create({
      data: {
        interventionId: intervention.id,
        userId: params.userId,
        outcomeKey: targetOutcome,
        scoreBefore: before,
        scoreAfter: after,
        delta,
      },
      select: { id: true },
    });

    return outcome.id;
  } catch (err) {
    console.error("[today] recordDailyIntervention failed:", err);
    return null;
  }
}
