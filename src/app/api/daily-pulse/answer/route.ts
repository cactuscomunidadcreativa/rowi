/**
 * POST /api/daily-pulse/answer
 *
 * Recibe la respuesta del Daily Pulse de hoy. Idempotente: si ya hay
 * respuesta de hoy, devuelve la existente sin sumar nada.
 *
 * Efectos al primer answer del día:
 *  - Crea PulsePointSignal (source "daily_pulse", value 1-5, pulsePointCode
 *    del mapeo BE2GROW de la pregunta).
 *  - Suma +5 UserPoints (reason MICRO_LEARNING).
 *  - Actualiza UserStreak: si lastActivityDate fue ayer → currentStreak++;
 *    si fue hace >1 día → reset a 1.
 *  - Devuelve feedback localizado según el bucket low/mid/high.
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import {
  feedbackForValue,
  questionForToday,
  type PulseLang,
} from "@/lib/daily-pulse/questions";
import { parseTz, startOfLocalDay } from "@/lib/daily-pulse/timezone";
import { awardPoints } from "@/services/gamification";
import { checkAndEvolve } from "@/services/avatar-evolution";

const DAILY_POINTS = 5;

function diffInDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      value?: number;
      lang?: string;
      tzOffsetMinutes?: number;
    };
    const value = Number(body.value);
    if (!Number.isFinite(value) || value < 1 || value > 5) {
      return NextResponse.json({ ok: false, error: "Value must be 1..5" }, { status: 400 });
    }
    const lang: PulseLang = ["en", "pt", "it"].includes(body.lang ?? "")
      ? (body.lang as PulseLang)
      : "es";
    const tz = parseTz(body.tzOffsetMinutes);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const q = questionForToday(now, tz);
    const today = startOfLocalDay(now, tz);

    // Idempotencia: si ya respondió hoy, no duplicar señal ni puntos.
    const existing = await prisma.pulsePointSignal.findFirst({
      where: {
        userId: user.id,
        source: "daily_pulse",
        createdAt: { gte: today },
      },
      select: { value: true, createdAt: true },
    });
    if (existing) {
      return NextResponse.json({
        ok: true,
        already: true,
        value: existing.value,
        feedback: feedbackForValue(q, existing.value, lang),
      });
    }

    // 1. Grabar la señal (alimenta el motor de inferencia VS).
    await prisma.pulsePointSignal.create({
      data: {
        userId: user.id,
        pulsePointCode: q.pulsePointCode,
        source: "daily_pulse",
        value,
        metadata: { sei: q.sei },
      },
    });

    // 2. Actualizar streak (antes de los puntos para que el multiplicador
    //    de awardPoints refleje la racha de hoy).
    const existingStreak = await prisma.userStreak.findUnique({
      where: { userId: user.id },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastActivityDate: true,
        streakStartDate: true,
      },
    });
    let currentStreak = 1;
    let streakStartDate: Date | null = today;
    if (existingStreak?.lastActivityDate) {
      const last = startOfLocalDay(existingStreak.lastActivityDate, tz);
      const days = diffInDays(today, last);
      if (days === 0) {
        // Imposible llegar acá si pasó el check de idempotencia, pero por
        // seguridad mantenemos la racha intacta.
        currentStreak = existingStreak.currentStreak;
        streakStartDate = existingStreak.streakStartDate ?? today;
      } else if (days === 1) {
        currentStreak = existingStreak.currentStreak + 1;
        streakStartDate = existingStreak.streakStartDate ?? last;
      } else {
        currentStreak = 1;
        streakStartDate = today;
      }
    }
    const longestStreak = Math.max(currentStreak, existingStreak?.longestStreak ?? 0);

    await prisma.userStreak.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        currentStreak,
        longestStreak,
        lastActivityDate: today,
        streakStartDate,
      },
      update: {
        currentStreak,
        longestStreak,
        lastActivityDate: today,
        streakStartDate,
      },
    });

    // 3. Sumar puntos por el camino canónico: actualiza UserLevel.totalPoints
    //    (el total que leen nivel, leaderboard, perfil y canje de rewards) y
    //    aplica multiplicadores de racha/nivel.
    const award = await awardPoints({
      userId: user.id,
      amount: DAILY_POINTS,
      reason: "MICRO_LEARNING",
      description: `daily-pulse · ${q.sei} · ${value}`,
    });

    // 4. La reflexión diaria MUEVE el avatar (la "Regla del Huevo": crece por
    //    Becoming, no solo por logins). Tras sumar puntos, recalculamos la
    //    evolución para que responder el pulse haga progresar/eclosionar al Rowi.
    //    Resiliente: un fallo aquí no debe romper el guardado de la respuesta.
    let evolution: {
      evolved: boolean;
      hatched: boolean;
      previousStage: string;
      newStage: string;
    } | null = null;
    try {
      const r = await checkAndEvolve(user.id);
      evolution = {
        evolved: r.evolved,
        hatched: r.hatched,
        previousStage: r.previousStage,
        newStage: r.newStage,
      };
    } catch (evoErr) {
      console.error("/api/daily-pulse/answer · checkAndEvolve failed:", evoErr);
    }

    return NextResponse.json({
      ok: true,
      already: false,
      value,
      pointsAdded: award.pointsAwarded,
      balance: award.totalPoints,
      streak: { current: currentStreak, longest: longestStreak },
      feedback: feedbackForValue(q, value, lang),
      evolution,
    });
  } catch (e: unknown) {
    console.error("/api/daily-pulse/answer error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
