/**
 * Racha diaria CANÓNICA (F3 · Rowi Launch 1.0).
 *
 * Antes, /api/today y /api/daily-pulse/answer duplicaban esta lógica sobre
 * la MISMA fila UserStreak (auditoría jun-2026, flujo B): dos contabilidades
 * que podían divergir. Ahora ambas pasan por aquí.
 *
 * Semántica: racha de ACTIVIDAD diaria — cualquier acto del loop (pulso o
 * reflexión) marca el día; es idempotente por día local del usuario.
 *
 * Además dispara triggerStreakMilestone en los hitos 3/7/30/100 (los
 * triggers existían como dead code: nadie los llamaba).
 */
import { prisma } from "@/core/prisma";
import { startOfLocalDay } from "@/lib/daily-pulse/timezone";
import { triggerStreakMilestone } from "@/lib/notifications/triggers";

const MILESTONES = new Set([3, 7, 30, 100]);

function diffInDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export interface DailyStreakResult {
  current: number;
  longest: number;
  /** true si el día local ya estaba contado (acción repetida hoy). */
  alreadyToday: boolean;
}

export async function updateDailyStreak(
  userId: string,
  tzOffsetMinutes: number,
  now: Date = new Date(),
): Promise<DailyStreakResult> {
  const today = startOfLocalDay(now, tzOffsetMinutes);

  const existing = await prisma.userStreak.findUnique({ where: { userId } });

  let current = 1;
  let streakStartDate: Date | null = today;
  let alreadyToday = false;

  if (existing?.lastActivityDate) {
    const last = startOfLocalDay(existing.lastActivityDate, tzOffsetMinutes);
    const days = diffInDays(today, last);
    if (days === 0) {
      alreadyToday = true;
      current = existing.currentStreak;
      streakStartDate = existing.streakStartDate ?? today;
    } else if (days === 1) {
      current = existing.currentStreak + 1;
      streakStartDate = existing.streakStartDate ?? last;
    } else {
      current = 1;
      streakStartDate = today;
    }
  }

  const longest = Math.max(current, existing?.longestStreak ?? 0);

  if (!alreadyToday) {
    await prisma.userStreak.upsert({
      where: { userId },
      create: { userId, currentStreak: current, longestStreak: longest, lastActivityDate: today, streakStartDate },
      update: { currentStreak: current, longestStreak: longest, lastActivityDate: today, streakStartDate },
    });

    // Hito alcanzado HOY (no en días repetidos): celebrarlo. Resiliente —
    // un fallo de notificación jamás rompe el guardado del loop.
    if (MILESTONES.has(current)) {
      try {
        await triggerStreakMilestone(userId, current, "daily_loop");
      } catch {
        /* noop */
      }
    }
  }

  return { current, longest, alreadyToday };
}
