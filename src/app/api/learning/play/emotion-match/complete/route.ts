/**
 * POST /api/learning/play/emotion-match/complete
 *
 * Persiste los puntos de una sesión de Emotion Match en UserPoints.
 * El servidor recalcula los puntos desde rounds + justifiedCount, sin
 * confiar en totalPoints del cliente.
 *
 * Anti-spam: 1 sesión por minuto por usuario (igual que pulse-pause).
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { awardPoints } from "@/services/gamification";

const POINTS_PICK = 5;
const POINTS_JUSTIFY = 10;
const MIN_INTERVAL_MS = 60_000;

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      rounds?: number;
      justifiedCount?: number;
    };
    const rounds = Number.isFinite(body.rounds) ? Math.max(0, Math.min(20, Number(body.rounds))) : 0;
    const justifiedCount = Number.isFinite(body.justifiedCount)
      ? Math.max(0, Math.min(rounds, Number(body.justifiedCount)))
      : 0;
    if (rounds === 0) {
      return NextResponse.json({ ok: false, error: "Invalid rounds" }, { status: 400 });
    }

    const pointsAdded = rounds * POINTS_PICK + justifiedCount * POINTS_JUSTIFY;

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const last = await prisma.userPoints.findFirst({
      where: { userId: user.id, reason: "MICRO_LEARNING", description: { contains: "emotion-match" } },
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
      description: `emotion-match · ${justifiedCount}/${rounds} justified`,
    });

    return NextResponse.json({
      ok: true,
      pointsAdded: award.pointsAwarded,
      balance: award.totalPoints,
      rounds,
      justifiedCount,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/learning/play/emotion-match/complete error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
