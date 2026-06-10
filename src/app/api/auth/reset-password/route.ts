/**
 * POST /api/auth/reset-password
 * ---------------------------------------------------------
 * Public endpoint. Body: { token, password }. Validates the
 * PasswordResetToken, hashes the new password with bcrypt, and
 * writes it to User.passwordHash (the dedicated field; the legacy
 * Account.access_token is cleared to avoid duplicating the hash).
 *
 * Rate-limited (authStrict: 5 / 5 min) by BOTH client IP and token,
 * so an attacker can't brute-force reset tokens or hammer the endpoint.
 *
 * Returns explicit error codes for the client UI:
 *   - rate_limited     (too many attempts)
 *   - missing_fields   (token or password missing)
 *   - password_too_short  (<8 chars)
 *   - invalid_token    (no row found)
 *   - already_used     (usedAt is set)
 *   - expired          (expiresAt in the past)
 *   - user_not_found
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/core/prisma";
import { secureLog } from "@/lib/logging";
import { rateLimiters } from "@/lib/security/rateLimit";

interface ResetBody {
  token?: string;
  password?: string;
}

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  try {
    let body: ResetBody;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const token = (body.token || "").trim();
    const password = body.password || "";

    // Rate limit por IP y por token (5 intentos / 5 min). Frena fuerza bruta de
    // tokens y abuso del endpoint. Con Upstash es distribuido; sin credenciales
    // cae a in-memory (fail-open) — aceptable como capa adicional.
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limited = await Promise.all([
      rateLimiters.authStrict(`reset-pw-ip:${ip}`),
      token ? rateLimiters.authStrict(`reset-pw-token:${token}`) : null,
    ]);
    const blocked = limited.find((r) => r && !r.success);
    if (blocked) {
      return NextResponse.json(
        { ok: false, error: "rate_limited" },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.max(1, Math.ceil((blocked.resetAt - Date.now()) / 1000)),
            ),
          },
        },
      );
    }

    if (!token || !password) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 },
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { ok: false, error: "password_too_short" },
        { status: 400 },
      );
    }

    const record = await prisma.passwordResetToken.findUnique({
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
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "user_not_found" },
        { status: 404 },
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    const credentialsAccount = await prisma.account.findFirst({
      where: { userId: user.id, provider: "credentials" },
      select: { id: true },
    });

    await prisma.$transaction(async (tx) => {
      // 🔐 El hash vive en User.passwordHash (campo dedicado). Limpiamos el
      // legacy access_token para no dejar el hash duplicado en el campo OAuth.
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: hashed },
      });

      if (credentialsAccount) {
        await tx.account.update({
          where: { id: credentialsAccount.id },
          data: { access_token: null },
        });
      } else {
        // Edge case: OAuth-only user adding a password via reset.
        await tx.account.create({
          data: {
            userId: user.id,
            type: "credentials",
            provider: "credentials",
            providerAccountId: user.email || user.id,
          },
        });
      }

      await tx.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });
    });

    secureLog.info(`[reset-password] success user=${user.id}`);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[reset-password] failed:", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
