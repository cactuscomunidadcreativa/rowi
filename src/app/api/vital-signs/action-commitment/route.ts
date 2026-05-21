export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

/**
 * Post-debrief action commitment with Expectancy Theory scoring (importance · clarity · believability).
 *
 * Body: { debriefId, description, pulsePointCode?, importance?, clarity?, believability?, dueDate? }
 */

function clamp01to100(n: unknown): number | undefined {
  if (typeof n !== "number") return undefined;
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.min(100, Math.round(n)));
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
    const { debriefId, description, pulsePointCode, importance, clarity, believability, dueDate } = body as {
      debriefId: string;
      description: string;
      pulsePointCode?: string;
      importance?: number;
      clarity?: number;
      believability?: number;
      dueDate?: string;
    };

    if (!debriefId || !description?.trim()) {
      return NextResponse.json(
        { ok: false, error: "debriefId and description required" },
        { status: 400 },
      );
    }

    const debrief = await prisma.debriefSession.findUnique({ where: { id: debriefId } });
    if (!debrief) {
      return NextResponse.json({ ok: false, error: "Debrief not found" }, { status: 404 });
    }
    if (debrief.facilitatorId !== user.id && debrief.subjectUserId !== user.id) {
      return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 403 });
    }

    const commitment = await prisma.actionCommitment.create({
      data: {
        debriefId,
        ownerUserId: debrief.subjectUserId ?? user.id,
        pulsePointCode: pulsePointCode ?? null,
        description: description.trim(),
        importance: clamp01to100(importance),
        clarity: clamp01to100(clarity),
        believability: clamp01to100(believability),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "planned",
      },
    });

    return NextResponse.json({ ok: true, commitment });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/vital-signs/action-commitment error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
