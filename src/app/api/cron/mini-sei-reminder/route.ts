// ============================================================
// Cron: monthly mini-SEI reminder.
//
// Invites active users to take their recurring mini-SEI (the monthly "trait"
// marker that complements the daily-pulse "state" signal). Skips anyone who
// already has a MiniSeiSnapshot in the last 25 days, so the cadence stays
// ~monthly and re-runs are idempotent.
//
// Auth: Bearer ${CRON_SECRET} (Vercel cron sends this automatically).
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
    title: "Tu Rowi Test del mes",
    message: "Toma 2 minutos para ver cómo evoluciona tu capacidad emocional este mes.",
  },
  en: {
    title: "Your monthly Rowi Test",
    message: "Take 2 minutes to see how your emotional capacity is evolving this month.",
  },
  pt: {
    title: "Seu Rowi Test do mês",
    message: "Leve 2 minutos para ver como sua capacidade emocional evolui este mês.",
  },
  it: {
    title: "Il tuo Rowi Test del mese",
    message: "Bastano 2 minuti per vedere come evolve la tua capacità emotiva questo mese.",
  },
};

function pickLocale(lang: string | null | undefined): Locale {
  const l = (lang ?? "es").toLowerCase();
  if (l.startsWith("en")) return "en";
  if (l.startsWith("pt")) return "pt";
  if (l.startsWith("it")) return "it";
  return "es";
}

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twentyFiveDaysAgo = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);

  try {
    const users = await prisma.user.findMany({
      where: {
        active: true,
        activityLogs: { some: { createdAt: { gte: thirtyDaysAgo } } },
      },
      select: { id: true, preferredLang: true, language: true },
      take: 5000,
    });

    // Idempotency: skip anyone with a mini-SEI in the last 25 days.
    const recent = await prisma.miniSeiSnapshot.findMany({
      where: { userId: { in: users.map((u) => u.id) }, takenAt: { gte: twentyFiveDaysAgo } },
      select: { userId: true },
    });
    const taken = new Set(recent.map((r) => r.userId));

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
      if (taken.has(user.id)) {
        skipped++;
        continue;
      }
      const locale = pickLocale(user.preferredLang ?? user.language);
      const copy = COPY[locale];
      try {
        await NotificationService.queue({
          userId: user.id,
          type: "EQ_ASSESSMENT_READY",
          title: copy.title,
          message: copy.message,
          actionUrl: "/hub/vital-signs?mini-sei=1",
          metadata: { source: "cron.mini-sei-reminder", locale },
        });
        sent++;
      } catch (err) {
        failed++;
        secureLog.error("[cron.mini-sei-reminder] queue failed", err, { userId: user.id });
      }
    }

    const ms = Date.now() - startedAt;
    secureLog.info("[cron.mini-sei-reminder] done", {
      sent,
      skipped,
      failed,
      candidates: users.length,
      ms,
    });
    return NextResponse.json({ ok: true, sent, skipped, failed, candidates: users.length });
  } catch (err) {
    secureLog.error("[cron.mini-sei-reminder] error", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
