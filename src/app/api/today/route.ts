/**
 * /api/today — el loop diario de TODAY (SEE → BECOME → PRACTICE → REFLECT).
 *
 * GET  ?tz=<offset>&lang=<l>  → estado del día. Crea la entrada del día si no
 *      existe y propone BECOME (identidad + práctica) de forma determinista
 *      desde el perfil EQ. Idempotente por (userId, localDate).
 *
 * POST { step, ... }  → avanza un paso del loop:
 *      - "morning":    { mood, intensity? }   "¿cómo llegas hoy?"
 *      - "practice":   { done }               marca la práctica del día
 *      - "reflection": { text }               "¿cuánto te estás pareciendo a quien quieres ser?"
 *
 * BECOME no se "elige": se propone al crear la entrada. No hay step para
 * elegir identidad de un menú (arquitectura: el sistema propone).
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { parseTz, localDateString, startOfLocalDay } from "@/lib/daily-pulse/timezone";
import {
  proposeBecomingFromProfileAndMemory,
  type BecomeLang,
  type CompetencyProfile,
  type RecentLoopSignal,
} from "@/lib/today/become";
import { logAffinityInteraction } from "@/ai/learning/affinityLearning";
import { awardPoints } from "@/services/gamification";
import { checkAndEvolve } from "@/services/avatar-evolution";
import { recordDailyIntervention } from "@/lib/today/intervention";
import { updateDailyStreak } from "@/lib/streak/updateDailyStreak";
import { trackFunnel } from "@/domains/metrics/lib/funnel";
import type { SeiKey } from "@/lib/vital-signs/catalog";

const SEI_KEYS: SeiKey[] = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

function resolveLang(input: unknown): BecomeLang {
  return ["en", "pt", "it"].includes(String(input)) ? (input as BecomeLang) : "es";
}


/** Puntos por cerrar la reflexión nocturna (logro de Becoming, no actividad vacía). */
const REFLECTION_POINTS = 15;

/**
 * Cierra el loop TODAY → Avatar → BECOMING: la reflexión nocturna actualiza la
 * racha de reflexión (la señal de Becoming que el huevo premia 6×), suma puntos
 * por el camino canónico y recalcula la evolución del avatar.
 *
 * Hasta hoy SOLO el Daily Pulse movía el avatar; la reflexión del loop diario no
 * recompensaba nada (la causa raíz de la retención débil, ver auditoría). Esto
 * replica el patrón de /api/daily-pulse/answer, atado a la reflexión de TODAY.
 *
 * Resiliente: cualquier fallo aquí no debe romper el guardado de la reflexión.
 */
async function rewardReflection(
  userId: string,
  now: Date,
  tz: number,
  practiceDone: boolean
): Promise<{
  pointsAdded: number;
  streak: { current: number; longest: number };
  evolution: {
    evolved: boolean;
    hatched: boolean;
    previousStage: string;
    newStage: string;
  } | null;
} | null> {
  try {
    // 1. Racha de actividad diaria — lógica CANÓNICA compartida con
    //    /api/daily-pulse/answer (antes duplicada y divergente). Idempotente
    //    por día local; dispara el hito 3/7/30/100 si corresponde.
    const streakResult = await updateDailyStreak(userId, tz, now);
    const { current: currentStreak, longest: longestStreak, alreadyToday } = streakResult;

    // 2. Puntos por el camino canónico (mueve UserLevel.totalPoints, el total que
    //    leen nivel/leaderboard/perfil). ACHIEVEMENT, no CHAT/DAILY_LOGIN: el
    //    avatar crece por evidencia de Becoming, no por actividad pasiva.
    let pointsAdded = 0;
    if (!alreadyToday) {
      const award = await awardPoints({
        userId,
        amount: REFLECTION_POINTS,
        reason: "ACHIEVEMENT",
        description: `today-reflection · practice=${practiceDone ? "done" : "skipped"}`,
      });
      pointsAdded = award.pointsAwarded;
    }

    // 3. Recalcular evolución: la racha de reflexión recién actualizada hace
    //    progresar/eclosionar al Rowi (calculateHatchProgress pondera la racha 3%/día).
    let evolution: {
      evolved: boolean;
      hatched: boolean;
      previousStage: string;
      newStage: string;
    } | null = null;
    const r = await checkAndEvolve(userId);
    evolution = {
      evolved: r.evolved,
      hatched: r.hatched,
      previousStage: r.previousStage,
      newStage: r.newStage,
    };

    return {
      pointsAdded,
      streak: { current: currentStreak, longest: longestStreak },
      evolution,
    };
  } catch (err) {
    console.error("/api/today · rewardReflection failed:", err);
    return null;
  }
}

async function getUserId(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = token?.email?.toLowerCase();
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}

/** Perfil de competencias del usuario: SEI formal → mini-SEI → null. */
async function getCompetencyProfile(userId: string): Promise<CompetencyProfile | null> {
  const snap = await prisma.eqSnapshot.findFirst({
    where: { userId },
    orderBy: { at: "desc" },
    select: { EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true },
  });
  if (snap && SEI_KEYS.some((k) => typeof snap[k] === "number")) {
    return snap as CompetencyProfile;
  }
  const mini = await prisma.miniSeiSnapshot.findFirst({
    where: { userId },
    orderBy: { takenAt: "desc" },
    select: { competencyProfile: true },
  });
  if (mini?.competencyProfile && typeof mini.competencyProfile === "object") {
    return mini.competencyProfile as CompetencyProfile;
  }
  return null;
}

/**
 * Señales recientes del loop para realimentar la propuesta BECOME (cierra
 * Today → Becoming → Today). Los últimos días con un BECOME propuesto, del más
 * reciente al más antiguo. No incluye el día de hoy (aún sin crear).
 */
async function getRecentLoopSignals(
  userId: string,
  excludeLocalDate: string
): Promise<RecentLoopSignal[]> {
  const rows = await prisma.dailyLoopEntry.findMany({
    where: { userId, localDate: { lt: excludeLocalDate } },
    orderBy: { localDate: "desc" },
    take: 5,
    select: { becomeSei: true, practiceDone: true },
  });
  return rows.map((r) => ({ becomeSei: r.becomeSei, practiceDone: r.practiceDone }));
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "auth.unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const tz = parseTz(url.searchParams.get("tz"));
    const lang = resolveLang(url.searchParams.get("lang"));
    const now = new Date();
    const localDate = localDateString(now, tz);

    let entry = await prisma.dailyLoopEntry.findUnique({
      where: { userId_localDate: { userId, localDate } },
    });

    // Crear la entrada del día con la propuesta BECOME determinista.
    if (!entry) {
      const profile = await getCompetencyProfile(userId);
      const recent = await getRecentLoopSignals(userId, localDate);
      const become = proposeBecomingFromProfileAndMemory(profile, recent, lang, now, tz);
      entry = await prisma.dailyLoopEntry.create({
        data: {
          userId,
          localDate,
          becomeSei: become.sei,
          becomeIdentity: become.identity,
          becomeAt: now,
          practiceText: become.practice,
        },
      });
    }

    return NextResponse.json({ ok: true, entry });
  } catch (e: unknown) {
    console.error("/api/today GET error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "auth.unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      step?: string;
      tzOffsetMinutes?: number;
      lang?: string;
      mood?: string;
      intensity?: number;
      done?: boolean;
      text?: string;
    };

    const tz = parseTz(body.tzOffsetMinutes);
    const lang = resolveLang(body.lang);
    const now = new Date();
    const localDate = localDateString(now, tz);

    // Asegurar que existe la entrada del día (con BECOME propuesto).
    let entry = await prisma.dailyLoopEntry.findUnique({
      where: { userId_localDate: { userId, localDate } },
    });
    if (!entry) {
      const profile = await getCompetencyProfile(userId);
      const recent = await getRecentLoopSignals(userId, localDate);
      const become = proposeBecomingFromProfileAndMemory(profile, recent, lang, now, tz);
      entry = await prisma.dailyLoopEntry.create({
        data: {
          userId,
          localDate,
          becomeSei: become.sei,
          becomeIdentity: become.identity,
          becomeAt: now,
          practiceText: become.practice,
        },
      });
    }

    const data: Record<string, unknown> = {};
    switch (body.step) {
      case "morning": {
        const mood = (body.mood ?? "").toString().slice(0, 200).trim();
        if (!mood) {
          return NextResponse.json({ ok: false, error: "mood.required" }, { status: 400 });
        }
        const intensity = Number(body.intensity);
        data.morningMood = mood;
        data.morningIntensity =
          Number.isFinite(intensity) && intensity >= 1 && intensity <= 5 ? intensity : null;
        data.morningAt = now;
        break;
      }
      case "practice": {
        data.practiceDone = body.done !== false;
        data.practiceAt = now;
        break;
      }
      case "reflection": {
        const text = (body.text ?? "").toString().slice(0, 1000).trim();
        if (!text) {
          return NextResponse.json({ ok: false, error: "reflection.required" }, { status: 400 });
        }
        data.reflectionText = text;
        data.reflectionAt = now;
        break;
      }
      default:
        return NextResponse.json({ ok: false, error: "step.invalid" }, { status: 400 });
    }

    const updated = await prisma.dailyLoopEntry.update({
      where: { userId_localDate: { userId, localDate } },
      data,
    });

    // EL FOSO (inicio): cerrar la reflexión nocturna ES la señal de Becoming más
    // honesta — la relación del usuario consigo mismo. Encendemos la captura de
    // aprendizaje (logAffinityInteraction hoy nunca se llamaba → tabla vacía).
    // Es la relación self↔self; resiliente (la función traga sus errores).
    let reward: Awaited<ReturnType<typeof rewardReflection>> = null;
    if (body.step === "reflection") {
      await logAffinityInteraction({
        userId,
        memberId: userId, // self-relación: el Becoming es contigo mismo
        context: updated.becomeSei ?? "becoming",
        emotionTag: "positiva", // la pregunta nocturna siempre busca el momento de éxito
        effectiveness: updated.practiceDone ? 0.8 : 0.6,
        notes: "daily_loop_reflection",
      });

      // TODAY → Avatar → BECOMING: la reflexión mueve el avatar (antes no pasaba
      // nada al cerrar el loop → retención débil). Streak + puntos + evolución.
      reward = await rewardReflection(userId, now, tz, updated.practiceDone === true);

      // EL FOSO (causal): primer escritor de Intervention → InterventionOutcome.
      // Cerrar el loop registra el par before/after de la práctica del día.
      // Honesto: es adherencia+estado (hypothesis_v0), no efecto calibrado.
      await recordDailyIntervention({
        userId,
        becomeSei: updated.becomeSei,
        practiceText: updated.practiceText,
        practiceDone: updated.practiceDone === true,
        morningIntensity: updated.morningIntensity,
      });

      // Embudo: cerrar el loop diario es la señal de retención más honesta.
      // Lo emitimos al guardar la reflexión (paso final del loop). No crítico.
      await trackFunnel("today_completed", {
        userId,
        req,
        details: { localDate, practiceDone: updated.practiceDone === true },
      });
    }

    return NextResponse.json({ ok: true, entry: updated, reward });
  } catch (e: unknown) {
    console.error("/api/today POST error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
