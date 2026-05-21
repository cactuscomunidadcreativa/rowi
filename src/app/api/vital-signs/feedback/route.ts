export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

/**
 * Record a "3 highlighters" verdict on a pulse point or driver — the human validation of
 * the BE2GROW hypothesis. One of: OWN | CONSIDER | REJECT.
 *
 * Body: { pulsePointCode, verdict, comment?, assessmentId?, inferenceId? }
 */

const VALID_VERDICTS = new Set(["OWN", "CONSIDER", "REJECT"]);

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
    const { pulsePointCode, verdict, comment, assessmentId, inferenceId } = body as {
      pulsePointCode: string;
      verdict: "OWN" | "CONSIDER" | "REJECT";
      comment?: string;
      assessmentId?: string;
      inferenceId?: string;
    };

    if (!pulsePointCode || !VALID_VERDICTS.has(verdict)) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    const feedback = await prisma.hypothesisFeedback.create({
      data: {
        pulsePointCode,
        verdict,
        comment: comment ?? null,
        assessmentId: assessmentId ?? null,
        inferenceId: inferenceId ?? null,
        respondentId: user.id,
      },
    });

    return NextResponse.json({ ok: true, feedback });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/vital-signs/feedback error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
