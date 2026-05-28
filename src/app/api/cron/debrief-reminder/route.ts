// src/app/api/cron/debrief-reminder/route.ts
// ============================================================
// Debrief Reminder Cron — nudges users whose Vital Signs debrief
// was scheduled more than 48h ago and is still not completed.
// ============================================================
// Schedule: every day at 14:00 UTC (`0 14 * * *`) — see vercel.json.
//
// Strategy:
//  1. Find DebriefSessions with status != "completed", completedAt = null,
//     scheduledAt older than 48h, scheduledAt within the last 21 days (so
//     we don't pester users about really old stale debriefs).
//  2. Skip ones where we already logged action="DEBRIEF_REMINDER_SENT"
//     in the last 5 days (idempotency window covers daily reruns).
//  3. Send WEEKFLOW_REMINDER to the subjectUserId when present, else the
//     facilitatorId.
//  4. Record an ActivityLog so the next run skips.
//
// Auth: Bearer ${CRON_SECRET}.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { NotificationService } from "@/lib/notifications";
import { secureLog } from "@/lib/logging";

export const runtime = "nodejs";
export const maxDuration = 300;

type Locale = "es" | "en" | "pt" | "it";

const COPY: Record<Locale, { title: string; message: string }> = {
  es: {
    title: "Tu debrief de Vital Signs te espera",
    message: "Tu sesión de debrief está pendiente desde hace más de 48 horas. Retómala cuando puedas para cerrar el ciclo.",
  },
  en: {
    title: "Your Vital Signs debrief is waiting",
    message: "Your debrief session has been pending for more than 48 hours. Pick it back up when you can to close the loop.",
  },
  pt: {
    title: "Seu debrief de Vital Signs está esperando",
    message: "Sua sessão de debrief está pendente há mais de 48 horas. Retome quando puder para fechar o ciclo.",
  },
  it: {
    title: "Il tuo debrief di Vital Signs ti aspetta",
    message: "La tua sessione di debrief è in sospeso da più di 48 ore. Riprendila quando puoi per chiudere il ciclo.",
  },
};

function pickLocale(input: string | null | undefined): Locale {
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
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  try {
    const stale = await prisma.debriefSession.findMany({
      where: {
        completedAt: null,
        status: { notIn: ["completed", "abandoned"] },
        scheduledAt: { lt: fortyEightHoursAgo, gte: twentyOneDaysAgo },
      },
      select: {
        id: true,
        scope: true,
        subjectUserId: true,
        facilitatorId: true,
        scheduledAt: true,
      },
      take: 2000,
    });

    // Idempotency: which debriefs already got a reminder recently?
    const debriefIds = stale.map((d) => d.id);
    const recentLogs = debriefIds.length
      ? await prisma.activityLog.findMany({
          where: {
            action: "DEBRIEF_REMINDER_SENT",
            entity: "DebriefSession",
            targetId: { in: debriefIds },
            createdAt: { gte: fiveDaysAgo },
          },
          select: { targetId: true },
        })
      : [];
    const alreadyReminded = new Set(recentLogs.map((l) => l.targetId).filter(Boolean) as string[]);

    // Resolve recipient userIds and load their locale
    const recipients = stale
      .filter((d) => !alreadyReminded.has(d.id))
      .map((d) => ({
        debriefId: d.id,
        userId: d.subjectUserId ?? d.facilitatorId,
        scope: d.scope,
      }))
      .filter((r): r is { debriefId: string; userId: string; scope: string } => Boolean(r.userId));

    const uniqueUserIds = Array.from(new Set(recipients.map((r) => r.userId)));
    const userLangs = uniqueUserIds.length
      ? await prisma.user.findMany({
          where: { id: { in: uniqueUserIds }, active: true },
          select: { id: true, preferredLang: true, language: true },
        })
      : [];
    const langById = new Map(
      userLangs.map((u) => [u.id, pickLocale(u.preferredLang ?? u.language)] as const)
    );

    let sent = 0;
    let skipped = stale.length - recipients.length;
    let failed = 0;

    for (const r of recipients) {
      const locale = langById.get(r.userId);
      if (!locale) {
        // user is inactive or missing — skip
        skipped++;
        continue;
      }
      const copy = COPY[locale];

      try {
        await NotificationService.queue({
          userId: r.userId,
          type: "WEEKFLOW_REMINDER",
          title: copy.title,
          message: copy.message,
          actionUrl: `/vital-signs/debrief/${r.debriefId}`,
          metadata: { source: "cron.debrief-reminder", debriefId: r.debriefId, scope: r.scope, locale },
        });

        await prisma.activityLog.create({
          data: {
            userId: r.userId,
            action: "DEBRIEF_REMINDER_SENT",
            entity: "DebriefSession",
            targetId: r.debriefId,
            details: { scope: r.scope, locale },
          },
        });

        sent++;
      } catch (err) {
        failed++;
        secureLog.error("[cron.debrief-reminder] queue failed", err, {
          userId: r.userId,
          debriefId: r.debriefId,
        });
      }
    }

    const ms = Date.now() - startedAt;
    secureLog.info("[cron.debrief-reminder] done", {
      sent,
      skipped,
      failed,
      candidates: stale.length,
      ms,
    });

    return NextResponse.json({
      ok: true,
      sent,
      skipped,
      failed,
      candidates: stale.length,
      ms,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    secureLog.error("[cron.debrief-reminder] fatal", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
