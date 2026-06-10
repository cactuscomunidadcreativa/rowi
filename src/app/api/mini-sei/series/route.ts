/**
 * GET /api/mini-sei/series
 *
 * Returns the signed-in user's mini-SEI snapshots over time — the Total EQ
 * trait trend, with the indicative competency profile per point. Powers the
 * trend card and feeds the Emotional Budgeting cross (latest = capacity).
 *
 * Query: ?limit=N (default 24, max 60)
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const limitParam = parseInt(req.nextUrl.searchParams.get("limit") ?? "24", 10);
    const limit = Math.min(60, Math.max(1, Number.isFinite(limitParam) ? limitParam : 24));

    const snapshots = await prisma.miniSeiSnapshot.findMany({
      where: { userId: user.id },
      orderBy: { takenAt: "asc" },
      take: limit,
      select: {
        id: true,
        takenAt: true,
        totalEq: true,
        totalEqBand: true,
        competencyProfile: true,
        scaleVersion: true,
        source: true,
      },
    });

    const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
    const first = snapshots.length > 0 ? snapshots[0] : null;
    const trend =
      latest && first && latest.id !== first.id
        ? Math.round((latest.totalEq - first.totalEq) * 10) / 10
        : null;

    return NextResponse.json({
      ok: true,
      count: snapshots.length,
      latestTotalEq: latest?.totalEq ?? null,
      trendSinceFirst: trend,
      series: snapshots,
    });
  } catch (e: unknown) {
    console.error("/api/mini-sei/series error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
