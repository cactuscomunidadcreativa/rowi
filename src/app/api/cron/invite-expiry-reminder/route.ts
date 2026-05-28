// src/app/api/cron/invite-expiry-reminder/route.ts
// ============================================================
// Invite Expiry Reminder Cron — emails a single "your invitation
// expires tomorrow" nudge to invitees who haven't accepted yet.
// ============================================================
// Schedule: every day at 10:00 UTC (`0 10 * * *`) — see vercel.json.
//
// Strategy:
//  1. Find InviteToken rows where:
//       - expiresAt is between now+24h and now+48h (the ~1 day window)
//       - reminderSentAt is null (haven't reminded yet)
//       - acceptedAt is null and revokedAt is null (the invite is still
//         in "pending" state — canonical fields, with a User-existence
//         fallback below for older invites created before acceptedAt
//         was populated).
//  2. For each, send a reminder email via `sendInviteEmail({ kind: "reminder" })`.
//  3. Stamp reminderSentAt to avoid double-sending tomorrow.
//
// Auth: Bearer ${CRON_SECRET}.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { sendInviteEmail, type InviteEmailLocale } from "@/lib/email/sendInviteEmail";
import { getServerAppBaseUrl } from "@/core/utils/base-url";
import { secureLog } from "@/lib/logging";

export const runtime = "nodejs";
export const maxDuration = 300;

function pickLocale(input: string | null | undefined): InviteEmailLocale {
  const v = (input || "").toLowerCase();
  if (v === "en" || v === "pt" || v === "it") return v;
  return "es";
}

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  try {
    const candidates = await prisma.inviteToken.findMany({
      where: {
        reminderSentAt: null,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gte: in24h, lte: in48h },
      },
      include: {
        user: { select: { id: true, name: true, email: true, language: true, preferredLang: true } },
        tenant: { select: { id: true, name: true } },
      },
      take: 1000,
    });

    if (candidates.length === 0) {
      return NextResponse.json({
        ok: true,
        sent: 0,
        skipped: 0,
        failed: 0,
        candidates: 0,
        ms: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      });
    }

    // Fallback "accepted" check: a User exists with the invitee email.
    // For older invites where acceptedAt was never backfilled.
    const emails = Array.from(new Set(candidates.map((c) => c.email.toLowerCase())));
    const accepted = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { email: true },
    });
    const acceptedEmails = new Set(accepted.map((u) => u.email.toLowerCase()));

    const baseUrl = getServerAppBaseUrl(req);

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const inv of candidates) {
      if (acceptedEmails.has(inv.email.toLowerCase())) {
        // Already accepted — mark reminderSentAt anyway so we don't keep
        // scanning it every day.
        await prisma.inviteToken.update({
          where: { id: inv.id },
          data: { reminderSentAt: new Date() },
        });
        skipped++;
        continue;
      }

      // Pick locale from the inviter (we don't know the invitee's lang
      // until they accept). Falls back to "es".
      const locale = pickLocale(inv.user?.preferredLang ?? inv.user?.language);
      const inviteUrl = `${baseUrl}/invite/${inv.token}`;

      // Remaining days, rounded UP (so a 30h-away expiry shows "2 days").
      const msLeft = inv.expiresAt.getTime() - now.getTime();
      const daysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));

      try {
        const result = await sendInviteEmail({
          to: inv.email,
          inviteUrl,
          inviterName: inv.user?.name || inv.user?.email || null,
          workspaceName: inv.tenant?.name || null,
          role: inv.role || null,
          locale,
          expiresInDays: daysLeft,
          kind: "reminder",
        });

        if (!result.ok) {
          failed++;
          secureLog.warn("[cron.invite-expiry-reminder] send failed", {
            inviteId: inv.id,
            email: inv.email,
            error: result.error,
          });
          continue;
        }

        // Resend not configured (skipped=true) still counts as "we tried" —
        // mark to avoid re-attempting every day.
        await prisma.inviteToken.update({
          where: { id: inv.id },
          data: { reminderSentAt: new Date() },
        });

        sent++;
      } catch (err) {
        failed++;
        secureLog.error("[cron.invite-expiry-reminder] exception", err, {
          inviteId: inv.id,
        });
      }
    }

    const ms = Date.now() - startedAt;
    secureLog.info("[cron.invite-expiry-reminder] done", {
      sent,
      skipped,
      failed,
      candidates: candidates.length,
      ms,
    });

    return NextResponse.json({
      ok: true,
      sent,
      skipped,
      failed,
      candidates: candidates.length,
      ms,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    secureLog.error("[cron.invite-expiry-reminder] fatal", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
