/**
 * POST /api/mini-sei/submit
 *
 * Records a recurring mini-SEI snapshot (the monthly "trait" marker) for the
 * signed-in user. Body: { answers: { itemId: 1..5 }, source?: string }.
 * Scores via the hybrid item set (12 short-form items when provisioned, else
 * the 8-competency fallback) and persists a MiniSeiSnapshot.
 *
 * The competency profile is indicative (not normed); the response says so.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { scoreMiniSei } from "@/lib/mini-sei/score";

export async function POST(req: NextRequest) {
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

    const body = (await req.json().catch(() => ({}))) as {
      answers?: Record<string, number>;
      source?: string;
    };
    const answers = body.answers;
    if (!answers || typeof answers !== "object" || Object.keys(answers).length === 0) {
      return NextResponse.json({ ok: false, error: "Missing answers" }, { status: 400 });
    }
    // Validate values are 1-5.
    for (const v of Object.values(answers)) {
      if (typeof v !== "number" || v < 1 || v > 5) {
        return NextResponse.json({ ok: false, error: "Answers must be 1-5" }, { status: 400 });
      }
    }

    const result = scoreMiniSei(answers);

    const snapshot = await prisma.miniSeiSnapshot.create({
      data: {
        userId: user.id,
        totalEq: result.totalEq,
        totalEqBand: result.totalEqBand,
        competencyProfile: result.competencyProfile,
        answers,
        itemsVersion: result.itemsVersion,
        scaleVersion: result.scaleVersion,
        source: body.source === "onboarding" || body.source === "adhoc" ? body.source : "monthly",
      },
      select: { id: true, takenAt: true },
    });

    return NextResponse.json({
      ok: true,
      snapshotId: snapshot.id,
      takenAt: snapshot.takenAt,
      totalEq: result.totalEq,
      totalEqBand: result.totalEqBand,
      competencyProfile: result.competencyProfile,
      indicative: result.indicative,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/mini-sei/submit error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
