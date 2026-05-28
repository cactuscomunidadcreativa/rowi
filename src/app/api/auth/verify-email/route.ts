/**
 * GET /api/auth/verify-email?token=...
 * ---------------------------------------------------------
 * Public endpoint (no session required) that consumes an
 * EmailVerificationToken and flips User.emailVerified.
 *
 * Returns explicit error codes for the client UI:
 *   - missing_token   (no token in querystring)
 *   - invalid_token   (no row found)
 *   - already_used    (usedAt is set)
 *   - expired         (expiresAt in the past)
 *   - email_mismatch  (token.email != user.email)
 *   - user_not_found  (user was deleted)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "missing_token" },
        { status: 400 },
      );
    }

    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!record) {
      return NextResponse.json(
        { ok: false, error: "invalid_token" },
        { status: 404 },
      );
    }

    if (record.usedAt) {
      return NextResponse.json(
        { ok: false, error: "already_used" },
        { status: 410 },
      );
    }

    if (record.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { ok: false, error: "expired" },
        { status: 410 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: record.userId },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "user_not_found" },
        { status: 404 },
      );
    }

    if (user.email && user.email.toLowerCase() !== record.email.toLowerCase()) {
      return NextResponse.json(
        { ok: false, error: "email_mismatch" },
        { status: 409 },
      );
    }

    // Atomically: mark token used and verify email. If already verified,
    // we still consume the token (idempotent success).
    const now = new Date();
    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: now },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: user.emailVerified ?? now },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[verify-email] failed:", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
