export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

/**
 * Create or list DebriefSession instances.
 * POST creates a new debrief tied to an existing VitalSignsAssessment.
 * GET returns sessions the caller can see (as facilitator or as subject).
 */

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const sessions = await prisma.debriefSession.findMany({
      where: {
        OR: [{ facilitatorId: user.id }, { subjectUserId: user.id }],
      },
      orderBy: { scheduledAt: "desc" },
      take: 50,
      include: {
        assessment: { select: { id: true, scope: true, sampleSize: true, dataset: true } },
        _count: { select: { commitments: true } },
      },
    });

    return NextResponse.json({ ok: true, sessions });
  } catch (e: unknown) {
    console.error("/api/vital-signs/debrief GET error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { assessmentId, scope, subjectUserId, scheduledAt, notes } = body as {
      assessmentId: string;
      scope: "OVS" | "TVS" | "LVS_M1" | "LVS_M2" | "FVS";
      subjectUserId?: string;
      scheduledAt?: string;
      notes?: string;
    };

    if (!assessmentId || !scope) {
      return NextResponse.json(
        { ok: false, error: "assessmentId and scope required" },
        { status: 400 },
      );
    }

    const session = await prisma.debriefSession.create({
      data: {
        assessmentId,
        facilitatorId: user.id,
        subjectUserId: subjectUserId ?? user.id,
        scope,
        step: 0,
        status: "scheduled",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        notes: notes ?? null,
      },
    });

    return NextResponse.json({ ok: true, session });
  } catch (e: unknown) {
    console.error("/api/vital-signs/debrief POST error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
