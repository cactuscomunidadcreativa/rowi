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
} from "@/lib/daily-pulse/questions";

const DAILY_POINTS = 5;

function startOfDayUTC(d: Date = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

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
    };
    const value = Number(body.value);
    if (!Number.isFinite(value) || value < 1 || value > 5) {
      return NextResponse.json({ ok: false, error: "Value must be 1..5" }, { status: 400 });
    }
    const lang: "es" | "en" = body.lang === "en" ? "en" : "es";

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const q = questionForToday();
    const today = startOfDayUTC();

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

    // 2. Sumar puntos. Balance arrastrado desde el último registro.
    const lastPoints = await prisma.userPoints.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { balance: true },
    });
    const newBalance = (lastPoints?.balance ?? 0) + DAILY_POINTS;
    await prisma.userPoints.create({
      data: {
        userId: user.id,
        amount: DAILY_POINTS,
        balance: newBalance,
        reason: "MICRO_LEARNING",
        description: `daily-pulse · ${q.sei} · ${value}`,
      },
    });

    // 3. Actualizar streak.
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
      const last = startOfDayUTC(existingStreak.lastActivityDate);
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

    return NextResponse.json({
      ok: true,
      already: false,
      value,
      pointsAdded: DAILY_POINTS,
      balance: newBalance,
      streak: { current: currentStreak, longest: longestStreak },
      feedback: feedbackForValue(q, value, lang),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/daily-pulse/answer error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
