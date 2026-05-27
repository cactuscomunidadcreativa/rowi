/**
 * POST /api/learning/microlearnings/[slug]/complete
 *
 * Marca una micro-lesson como completada para el usuario actual. Crea
 * UserMicroLearning (o actualiza si ya existe) con status COMPLETED y
 * suma los puntos correspondientes en UserPoints.
 *
 * Idempotente: si ya estaba COMPLETED, no duplica puntos.
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { awardPoints } from "@/services/gamification";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

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

    const ml = await prisma.microLearning.findUnique({
      where: { slug },
      select: { id: true, points: true, isActive: true },
    });
    if (!ml || !ml.isActive) {
      return NextResponse.json({ ok: false, error: "Lesson not found" }, { status: 404 });
    }

    const existing = await prisma.userMicroLearning.findUnique({
      where: { userId_microLearningId: { userId: user.id, microLearningId: ml.id } },
    });
    if (existing && existing.status === "COMPLETED") {
      return NextResponse.json({
        ok: true,
        already: true,
        pointsEarned: existing.pointsEarned,
      });
    }

    const now = new Date();
    if (existing) {
      await prisma.userMicroLearning.update({
        where: { id: existing.id },
        data: {
          status: "COMPLETED",
          progress: 100,
          completedAt: now,
          pointsEarned: ml.points,
          lastAccessAt: now,
        },
      });
    } else {
      await prisma.userMicroLearning.create({
        data: {
          userId: user.id,
          microLearningId: ml.id,
          status: "COMPLETED",
          progress: 100,
          completedAt: now,
          startedAt: now,
          lastAccessAt: now,
          pointsEarned: ml.points,
        },
      });
    }

    const award = await awardPoints({
      userId: user.id,
      amount: ml.points,
      reason: "MICRO_LEARNING",
      reasonId: ml.id,
      description: `lesson · ${slug}`,
    });

    return NextResponse.json({
      ok: true,
      already: false,
      pointsEarned: award.pointsAwarded,
      balance: award.totalPoints,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/learning/microlearnings/[slug]/complete error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
