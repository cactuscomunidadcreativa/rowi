// src/app/api/cron/weekly-pulse/route.ts
// ============================================================
// Weekly Pulse Cron — sends WEEKFLOW_SUMMARY to active users
// ============================================================
// Schedule: Mondays 09:00 UTC (`0 9 * * 1`) — see vercel.json.
//
// Strategy:
//  1. Find users active in the last 60 days (User.active=true and either
//     createdAt within 60d OR has an ActivityLog in last 30d).
//  2. For each, ensure we haven't already logged action="WEEKLY_PULSE_SENT"
//     in the last 6 days (idempotency window — covers cron re-runs).
//  3. Queue a WEEKFLOW_SUMMARY notification via NotificationService.
//  4. Record an ActivityLog row so the next run skips.
//
// Auth: Bearer ${CRON_SECRET} (Vercel cron sends this automatically).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { NotificationService } from "@/lib/notifications";
import { secureLog } from "@/lib/logging";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min — may iterate many users

type Locale = "es" | "en" | "pt" | "it";

const COPY: Record<Locale, { title: string; message: string }> = {
  es: {
    title: "Tu resumen semanal de Rowi",
    message: "Empieza la semana con un pulso rápido: revisa tu progreso y planifica los próximos pasos.",
  },
  en: {
    title: "Your weekly Rowi pulse",
    message: "Kick off the week with a quick pulse: review your progress and plan your next steps.",
  },
  pt: {
    title: "Seu resumo semanal do Rowi",
    message: "Comece a semana com um pulso rápido: revise seu progresso e planeje os próximos passos.",
  },
  it: {
    title: "Il tuo pulse settimanale Rowi",
    message: "Inizia la settimana con un pulse veloce: rivedi i tuoi progressi e pianifica i prossimi passi.",
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
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

  try {
    // Candidate users: active=true, AND either created in last 60d OR had
    // an activity in last 30d. Cap to a sane batch so a single cron run
    // doesn't time out.
    const users = await prisma.user.findMany({
      where: {
        active: true,
        OR: [
          { createdAt: { gte: sixtyDaysAgo } },
          { activityLogs: { some: { createdAt: { gte: thirtyDaysAgo } } } },
        ],
      },
      select: {
        id: true,
        preferredLang: true,
        language: true,
      },
      take: 5000,
    });

    // Idempotency: which of these already got a pulse this week?
    const recentlySent = await prisma.activityLog.findMany({
      where: {
        action: "WEEKLY_PULSE_SENT",
        createdAt: { gte: sixDaysAgo },
        userId: { in: users.map((u) => u.id) },
      },
      select: { userId: true },
    });
    const alreadySent = new Set(recentlySent.map((r) => r.userId).filter(Boolean) as string[]);

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
      if (alreadySent.has(user.id)) {
        skipped++;
        continue;
      }

      const locale = pickLocale(user.preferredLang ?? user.language);
      const copy = COPY[locale];

      try {
        await NotificationService.queue({
          userId: user.id,
          type: "WEEKFLOW_SUMMARY",
          title: copy.title,
          message: copy.message,
          actionUrl: "/weekflow",
          metadata: { source: "cron.weekly-pulse", locale },
        });

        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: "WEEKLY_PULSE_SENT",
            entity: "User",
            targetId: user.id,
            details: { locale },
          },
        });

        sent++;
      } catch (err) {
        failed++;
        secureLog.error("[cron.weekly-pulse] queue failed", err, { userId: user.id });
      }
    }

    const ms = Date.now() - startedAt;
    secureLog.info("[cron.weekly-pulse] done", { sent, skipped, failed, candidates: users.length, ms });

    return NextResponse.json({
      ok: true,
      sent,
      skipped,
      failed,
      candidates: users.length,
      ms,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    secureLog.error("[cron.weekly-pulse] fatal", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
