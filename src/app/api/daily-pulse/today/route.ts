/**
 * GET /api/daily-pulse/today
 *
 * Devuelve la pregunta del día de hoy (rotación dayOfYear % 8 por las 8
 * SEI competencies), si el usuario ya respondió hoy, y el estado actual
 * de su streak.
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { questionForToday } from "@/lib/daily-pulse/questions";

function startOfDayUTC(d: Date = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const q = questionForToday();
    const today = startOfDayUTC();

    const [answeredToday, streak] = await Promise.all([
      prisma.pulsePointSignal.findFirst({
        where: {
          userId: user.id,
          source: "daily_pulse",
          createdAt: { gte: today },
        },
        select: { value: true, createdAt: true, pulsePointCode: true },
      }),
      prisma.userStreak.findUnique({
        where: { userId: user.id },
        select: { currentStreak: true, longestStreak: true, lastActivityDate: true },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      question: {
        sei: q.sei,
        pulsePointCode: q.pulsePointCode,
        esQuestion: q.esQuestion,
        enQuestion: q.enQuestion,
      },
      answeredToday: answeredToday
        ? { value: answeredToday.value, at: answeredToday.createdAt }
        : null,
      streak: {
        current: streak?.currentStreak ?? 0,
        longest: streak?.longestStreak ?? 0,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/daily-pulse/today error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
