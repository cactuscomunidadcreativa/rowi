/**
 * POST /api/auth/forgot-password
 * ---------------------------------------------------------
 * Public endpoint. Accepts { email } and — if the user exists
 * — issues a PasswordResetToken and emails a reset link.
 *
 * Anti-enumeration: ALWAYS returns the same success shape
 * regardless of whether the email matched a real account.
 *
 * Rate limited: 3 requests / 1h / email (case-insensitive)
 * to mitigate spam and brute-force.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/core/prisma";
import { getServerAppBaseUrl } from "@/core/utils/base-url";
import { sendPasswordResetEmail } from "@/lib/email/sendPasswordResetEmail";
import { rateLimit } from "@/lib/security/rateLimit";
import { secureLog } from "@/lib/logging";

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface ForgotBody {
  email?: string;
}

export async function POST(req: NextRequest) {
  try {
    let body: ForgotBody;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const rawEmail = (body.email || "").trim().toLowerCase();
    if (!rawEmail) {
      return NextResponse.json(
        { ok: false, error: "email_required" },
        { status: 400 },
      );
    }

    // Rate limit: 3 / hour / email.
    const rl = await rateLimit(`forgot:${rawEmail}`, {
      limit: 3,
      window: 60 * 60,
      prefix: "auth",
    });
    if (!rl.success) {
      return NextResponse.json(
        { ok: false, error: "rate_limited" },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000)),
            ),
          },
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: rawEmail },
      select: { id: true, email: true, name: true, language: true },
    });

    // ALWAYS respond the same way to avoid leaking account existence.
    const successResponse = NextResponse.json({
      ok: true,
      message: "if-exists",
    });

    if (!user || !user.email) {
      secureLog.info(`[forgot-password] no-account email=${rawEmail}`);
      return successResponse;
    }

    // Revoke any previously issued, unused tokens.
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        email: user.email,
        token,
        expiresAt,
      },
    });

    const resetUrl = `${getServerAppBaseUrl(req)}/reset-password?token=${encodeURIComponent(token)}`;

    // Non-blocking send: we don't surface email errors to the caller,
    // because that would reveal whether the account existed.
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
        locale: user.language || "es",
      });
    } catch (emailErr) {
      console.warn("[forgot-password] email send error (non-fatal):", emailErr);
    }

    return successResponse;
  } catch (err: unknown) {
    console.error("[forgot-password] failed:", err);
    // Still return the anti-enumeration message on internal errors.
    return NextResponse.json({ ok: true, message: "if-exists" });
  }
}
