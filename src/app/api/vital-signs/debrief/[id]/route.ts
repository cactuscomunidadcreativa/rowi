export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

/**
 * GET /api/vital-signs/debrief/:id — full session detail incl. commitments + feedbacks
 * PATCH /api/vital-signs/debrief/:id — advance step / update notes / mark completed
 */

async function authorize(req: NextRequest, sessionId: string) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = token?.email?.toLowerCase();
  if (!email) return { error: "Unauthorized", status: 401 as const };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "User not found", status: 404 as const };

  const session = await prisma.debriefSession.findUnique({
    where: { id: sessionId },
    include: {
      assessment: {
        include: { scores: true },
      },
      commitments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!session) return { error: "Session not found", status: 404 as const };

  if (session.facilitatorId !== user.id && session.subjectUserId !== user.id) {
    return { error: "Not authorized", status: 403 as const };
  }

  return { user, session };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await authorize(req, id);
    if ("error" in auth) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const feedbacks = await prisma.hypothesisFeedback.findMany({
      where: { assessmentId: auth.session.assessmentId, respondentId: auth.user.id },
    });

    return NextResponse.json({
      ok: true,
      session: auth.session,
      feedbacks,
    });
  } catch (e: unknown) {
    console.error("/api/vital-signs/debrief/[id] GET error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await authorize(req, id);
    if ("error" in auth) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { step, notes, status } = body as {
      step?: number;
      notes?: string;
      status?: "scheduled" | "in_progress" | "completed" | "abandoned";
    };

    const updated = await prisma.debriefSession.update({
      where: { id },
      data: {
        ...(typeof step === "number" ? { step, status: step === 7 ? "completed" : "in_progress" } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(status ? { status } : {}),
        ...(status === "completed" ? { completedAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ ok: true, session: updated });
  } catch (e: unknown) {
    console.error("/api/vital-signs/debrief/[id] PATCH error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
