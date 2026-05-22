/**
 * GET /api/daily-pulse/history?days=7
 *
 * Devuelve las respuestas del Daily Pulse del usuario para los últimos N
 * días (default 7). Cada día tiene a lo sumo una respuesta (idempotencia
 * del endpoint /answer). Días sin respuesta se devuelven con value=null.
 *
 * Útil para el sparkline de "tu semana" en /hub/vital-signs.
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

const MAX_DAYS = 30;

function startOfDayUTC(d: Date): Date {
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

    const url = new URL(req.url);
    const daysParam = Number(url.searchParams.get("days") ?? 7);
    const days = Math.max(1, Math.min(MAX_DAYS, Number.isFinite(daysParam) ? daysParam : 7));

    const now = new Date();
    const startDay = startOfDayUTC(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));

    const signals = await prisma.pulsePointSignal.findMany({
      where: {
        userId: user.id,
        source: "daily_pulse",
        createdAt: { gte: startDay },
      },
      select: {
        value: true,
        createdAt: true,
        pulsePointCode: true,
        metadata: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Agrupar por día UTC.
    const byDay = new Map<string, { value: number; sei?: string; pulsePointCode: string }>();
    for (const s of signals) {
      const k = startOfDayUTC(s.createdAt).toISOString();
      if (!byDay.has(k)) {
        const sei = (s.metadata as { sei?: string } | null)?.sei;
        byDay.set(k, { value: s.value, sei, pulsePointCode: s.pulsePointCode });
      }
    }

    const items: Array<{
      date: string;
      value: number | null;
      sei: string | null;
      pulsePointCode: string | null;
    }> = [];
    for (let i = 0; i < days; i++) {
      const d = startOfDayUTC(new Date(now.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000));
      const k = d.toISOString();
      const hit = byDay.get(k);
      items.push({
        date: k,
        value: hit?.value ?? null,
        sei: hit?.sei ?? null,
        pulsePointCode: hit?.pulsePointCode ?? null,
      });
    }

    const answered = items.filter((i) => i.value !== null).length;

    return NextResponse.json({ ok: true, days, items, answered });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/daily-pulse/history error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
