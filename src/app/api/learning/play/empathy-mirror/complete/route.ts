/**
 * POST /api/learning/play/empathy-mirror/complete
 *
 * Persiste puntos de Empathy Mirror. Server recalcula desde rounds +
 * describedCount + selfConnectCount (no confía en el cliente).
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { awardPoints } from "@/services/gamification";

const POINTS_REFLECT = 5;
const POINTS_DESCRIBE = 10;
const POINTS_SELF_CONNECT = 5;
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
      describedCount?: number;
      selfConnectCount?: number;
    };
    const rounds = Number.isFinite(body.rounds) ? Math.max(0, Math.min(20, Number(body.rounds))) : 0;
    const describedCount = Number.isFinite(body.describedCount)
      ? Math.max(0, Math.min(rounds, Number(body.describedCount)))
      : 0;
    const selfConnectCount = Number.isFinite(body.selfConnectCount)
      ? Math.max(0, Math.min(rounds, Number(body.selfConnectCount)))
      : 0;
    if (rounds === 0) {
      return NextResponse.json({ ok: false, error: "Invalid rounds" }, { status: 400 });
    }

    const pointsAdded =
      rounds * POINTS_REFLECT +
      describedCount * POINTS_DESCRIBE +
      selfConnectCount * POINTS_SELF_CONNECT;

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const last = await prisma.userPoints.findFirst({
      where: { userId: user.id, reason: "MICRO_LEARNING", description: { contains: "empathy-mirror" } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
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
      description: `empathy-mirror · described=${describedCount} selfConnect=${selfConnectCount}`,
    });

    return NextResponse.json({
      ok: true,
      pointsAdded: award.pointsAwarded,
      balance: award.totalPoints,
      rounds,
      describedCount,
      selfConnectCount,
    });
  } catch (e: unknown) {
    console.error("/api/learning/play/empathy-mirror/complete error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
