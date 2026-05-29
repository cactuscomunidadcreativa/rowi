/**
 * GET /api/daily-pulse/history?days=7&tz=300
 *
 * Devuelve las lecturas de pulso del usuario para los últimos N días
 * (default 7), agrupadas por el día LOCAL del usuario (mismo criterio que
 * /today y /answer). Incluye Daily Pulse (source "daily_pulse") y los
 * check-ins/microsignals de la página Vital Signs (source "self_check").
 * Cada día tiene a lo sumo una respuesta (la primera del día gana). Días sin
 * respuesta se devuelven con value=null. Cada item incluye `dow` (0-6, día
 * de semana local) para que el cliente etiquete sin recalcular el tz.
 *
 * Útil para el sparkline de "tu semana" en /hub/vital-signs.
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { parseTz, startOfLocalDay } from "@/lib/daily-pulse/timezone";

const MAX_DAYS = 30;

/** Partes del día LOCAL del usuario para un instante dado. */
function localParts(d: Date, tz: number): { key: string; dow: number; iso: string } {
  const local = new Date(d.getTime() - tz * 60_000);
  return {
    key: `${local.getUTCFullYear()}-${local.getUTCMonth()}-${local.getUTCDate()}`,
    dow: local.getUTCDay(),
    iso: startOfLocalDay(d, tz).toISOString(),
  };
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
    const tz = parseTz(url.searchParams.get("tz"));

    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const startDay = startOfLocalDay(new Date(now.getTime() - (days - 1) * dayMs), tz);

    const signals = await prisma.pulsePointSignal.findMany({
      where: {
        userId: user.id,
        // Cuenta tanto el Daily Pulse (dashboard) como el check-in/microsignal
        // de la página Vital Signs (source "self_check"): ambos son una lectura
        // del día del usuario y deben aparecer en "Tu semana". Antes solo se
        // leía "daily_pulse", así que los check-ins de la página VS no pintaban.
        source: { in: ["daily_pulse", "self_check"] },
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

    // Agrupar por día LOCAL del usuario (primer signal del día gana).
    const byDay = new Map<string, { value: number; sei?: string; pulsePointCode: string }>();
    for (const s of signals) {
      const k = localParts(s.createdAt, tz).key;
      if (!byDay.has(k)) {
        const sei = (s.metadata as { sei?: string } | null)?.sei;
        byDay.set(k, { value: s.value, sei, pulsePointCode: s.pulsePointCode });
      }
    }

    const items: Array<{
      date: string;
      dow: number;
      value: number | null;
      sei: string | null;
      pulsePointCode: string | null;
    }> = [];
    for (let i = 0; i < days; i++) {
      const ref = new Date(now.getTime() - (days - 1 - i) * dayMs);
      const p = localParts(ref, tz);
      const hit = byDay.get(p.key);
      items.push({
        date: p.iso,
        dow: p.dow,
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
