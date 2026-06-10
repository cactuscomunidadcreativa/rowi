/**
 * POST /api/public/pre-sei/follow-up — compromiso de retorno del Emotional
 * Mirror. Body: { token, email }.
 *
 * Guarda el email en la PreSeiSession del token; el cron pre-sei-followup
 * envía la micro-práctica al día siguiente. Sin auth (el Pre-SEI es público):
 * el token opaco ES la autorización — solo quien tiene el token de SU sesión
 * puede registrar el email. Rate-limit por IP contra abuso.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { rateLimit, getClientIdentifier } from "@/lib/security/rateLimit";
import { secureLog } from "@/lib/logging";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit(`presei_followup:${getClientIdentifier(req)}`, {
      limit: 10,
      window: 3600,
      prefix: "presei_followup",
    });
    if (!rl.success) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      token?: string;
      email?: string;
    };
    const token = (body.token || "").trim();
    const email = (body.email || "").trim().toLowerCase();

    if (!token || token.length > 64) {
      return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const session = await prisma.preSeiSession.findUnique({
      where: { token },
      select: { id: true, followUpSentAt: true },
    });
    if (!session) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    if (session.followUpSentAt) {
      // Ya se envió el follow-up de esta sesión; no re-armar.
      return NextResponse.json({ ok: true, already: true });
    }

    await prisma.preSeiSession.update({
      where: { id: session.id },
      data: { followUpEmail: email, followUpOptInAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    secureLog.error("pre-sei.follow-up.failed", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
