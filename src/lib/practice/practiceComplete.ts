/**
 * 🎭 Cierre de una sesión de práctica → gamificación + loop diario.
 *
 * Replica el patrón canónico de rewardReflection (/api/today): la práctica
 * deliberada es EVIDENCIA de Becoming, así que recompensa por ACHIEVEMENT,
 * mueve el avatar (checkAndEvolve) y marca la práctica del día en el loop
 * (Today ↔ Practice). Resiliente: cualquier fallo aquí no rompe el guardado de
 * la sesión.
 */

import { prisma } from "@/core/prisma";
import { awardPoints } from "@/services/gamification";
import { checkAndEvolve } from "@/services/avatar-evolution";
import { localDateString } from "@/lib/daily-pulse/timezone";

/** Puntos por completar una sesión de práctica (alineado con REFLECTION_POINTS). */
export const PRACTICE_POINTS = 20;

export interface PracticeCompletionResult {
  pointsAdded: number;
  evolution: {
    evolved: boolean;
    hatched: boolean;
    previousStage: string;
    newStage: string;
  } | null;
}

/**
 * @param tz offset en minutos (como parseTz) para fijar el día local.
 */
export async function completePractice(
  userId: string,
  score: number,
  tz: number,
  now: Date = new Date(),
): Promise<PracticeCompletionResult> {
  const result: PracticeCompletionResult = { pointsAdded: 0, evolution: null };
  try {
    // 1. Puntos — ACHIEVEMENT (evidencia de Becoming, no actividad pasiva).
    const award = await awardPoints({
      userId,
      amount: PRACTICE_POINTS,
      reason: "ACHIEVEMENT",
      description: `practice-session · score=${score}`,
    });
    result.pointsAdded = award.pointsAwarded;

    // 2. Avatar — la práctica recién completada hace progresar/eclosionar al Rowi.
    const evo = await checkAndEvolve(userId);
    result.evolution = {
      evolved: evo.evolved,
      hatched: evo.hatched,
      previousStage: evo.previousStage,
      newStage: evo.newStage,
    };

    // 3. Loop diario — marcar la práctica del día (idempotente por userId+día).
    //    No crea la entrada si no existe (eso lo hace el GET de /api/today de
    //    forma eager); aquí solo la marcamos si ya está.
    const localDate = localDateString(now, tz);
    await prisma.dailyLoopEntry.updateMany({
      where: { userId, localDate, practiceDone: false },
      data: { practiceDone: true, practiceAt: now },
    });
  } catch (err) {
    console.error("/api/practice · completePractice failed:", err);
  }
  return result;
}
