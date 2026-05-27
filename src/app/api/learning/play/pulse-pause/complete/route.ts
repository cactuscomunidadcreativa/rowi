/**
 * POST /api/learning/play/pulse-pause/complete
 *
 * Recibe el resultado de una sesión de Pulse Pause y graba los puntos
 * en UserPoints con reason=MICRO_LEARNING. Calcula el balance corriente
 * desde el último registro para mantener la columna `balance` correcta.
 *
 * Límites:
 * - totalPoints máximo = rounds × 20 (mantener los 6 segundos en todas
 *   las rondas). El servidor recalcula desde pauseCount para no confiar
 *   en el cliente: pauseCount × 20 + (rounds − pauseCount) × 5.
 * - Rate limit suave: una sesión por minuto por usuario (anti-farming
 *   trivial; quien quiera spamear puede, pero la auditoría queda).
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { awardPoints } from "@/services/gamification";

const POINTS_FULL_HOLD = 20;
const POINTS_REACTED = 5;
const MIN_INTERVAL_MS = 60_000;

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      pauseCount?: number;
      rounds?: number;
      totalPoints?: number;
    };
    const rounds = Number.isFinite(body.rounds) ? Math.max(0, Math.min(20, Number(body.rounds))) : 0;
    const pauseCount = Number.isFinite(body.pauseCount)
      ? Math.max(0, Math.min(rounds, Number(body.pauseCount)))
      : 0;
    if (rounds === 0) {
      return NextResponse.json({ ok: false, error: "Invalid rounds" }, { status: 400 });
    }

    // Recompute server-side (don't trust client totalPoints).
    const pointsAdded =
      pauseCount * POINTS_FULL_HOLD + (rounds - pauseCount) * POINTS_REACTED;

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Anti-spam suave: no aceptar dos completes en menos de 1 minuto.
    const last = await prisma.userPoints.findFirst({
      where: { userId: user.id, reason: "MICRO_LEARNING", description: { contains: "pulse-pause" } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, balance: true },
    });
    if (last && Date.now() - last.createdAt.getTime() < MIN_INTERVAL_MS) {
      return NextResponse.json(
        { ok: false, error: "Esperá un minuto antes de jugar otra ronda." },
        { status: 429 },
      );
    }

    const award = await awardPoints({
      userId: user.id,
      amount: pointsAdded,
      reason: "MICRO_LEARNING",
      description: `pulse-pause · ${pauseCount}/${rounds} paused`,
    });

    return NextResponse.json({
      ok: true,
      pointsAdded: award.pointsAwarded,
      balance: award.totalPoints,
      pauseCount,
      rounds,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/learning/play/pulse-pause/complete error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
