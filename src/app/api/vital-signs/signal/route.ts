export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { PULSE_POINTS } from "@/lib/vital-signs/catalog";

/**
 * Record a microsignal — a daily-life interaction in Rowi that maps to a Pulse Point.
 *
 * Body: { pulsePointCode, source, value, evidenceRef?, teamId?, orgId?, metadata? }
 *
 * Sources: challenge | self_check | micro_survey | ai_inferred | conversation | ritual | event
 */

const VALID_PP_CODES = new Set(PULSE_POINTS.map((p) => p.code));

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
    const {
      pulsePointCode,
      source,
      value,
      evidenceRef,
      teamId,
      orgId,
      metadata,
    } = body as {
      pulsePointCode: string;
      source: string;
      value: number;
      evidenceRef?: string;
      teamId?: string;
      orgId?: string;
      metadata?: Record<string, unknown>;
    };

    if (!VALID_PP_CODES.has(pulsePointCode as never)) {
      return NextResponse.json({ ok: false, error: "Invalid pulsePointCode" }, { status: 400 });
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return NextResponse.json({ ok: false, error: "value must be number" }, { status: 400 });
    }

    const signal = await prisma.pulsePointSignal.create({
      data: {
        pulsePointCode,
        userId: user.id,
        teamId: teamId ?? null,
        orgId: orgId ?? null,
        source: source || "self_check",
        value,
        evidenceRef: evidenceRef ?? null,
        metadata: metadata ? (metadata as object) : undefined,
      },
    });

    return NextResponse.json({ ok: true, signal });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/vital-signs/signal error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
