/**
 * POST /api/auth/send-verification
 * ---------------------------------------------------------
 * Issues an EmailVerificationToken for the authenticated user
 * and emails the verification link. Idempotent in the sense
 * that any previously issued, unused tokens for the same user
 * are revoked (marked `usedAt`) before the new one is created.
 *
 * Returns:
 *   { ok: true }                  → email queued
 *   { ok: true, already: true }   → user.emailVerified already set
 *   { ok: false, error: string }
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";
import { getServerAppBaseUrl } from "@/core/utils/base-url";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail";
import { secureLog } from "@/lib/logging";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: NextRequest) {
  try {
    const authUser = await getServerAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    // getServerAuthUser doesn't include emailVerified/language — fetch them.
    const fullUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        language: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json(
        { ok: false, error: "user_not_found" },
        { status: 404 },
      );
    }

    if (fullUser.emailVerified) {
      return NextResponse.json({ ok: true, already: true });
    }

    if (!fullUser.email) {
      return NextResponse.json(
        { ok: false, error: "no_email" },
        { status: 400 },
      );
    }

    // Revoke any previously issued, unused tokens.
    await prisma.emailVerificationToken.updateMany({
      where: { userId: fullUser.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.emailVerificationToken.create({
      data: {
        userId: fullUser.id,
        email: fullUser.email,
        token,
        expiresAt,
      },
    });

    const verifyUrl = `${getServerAppBaseUrl(req)}/verify-email?token=${encodeURIComponent(token)}`;

    const result = await sendVerificationEmail({
      to: fullUser.email,
      name: fullUser.name,
      verifyUrl,
      locale: fullUser.language || "es",
    });

    if (!result.ok) {
      secureLog.info(
        `[send-verification] send failed user=${fullUser.id} error=${result.error}`,
      );
      return NextResponse.json(
        { ok: false, error: result.error || "send_failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[send-verification] failed:", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
