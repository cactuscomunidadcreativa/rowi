// ============================================================
// Cron: recordatorio nocturno de reflexión (F3 · Rowi Launch 1.0).
//
// El único canal de RETORNO diario del producto: usuarios que abrieron su
// día (existe DailyLoopEntry de las últimas 20h) pero no cerraron la
// reflexión nocturna reciben un nudge. La auditoría jun-2026 lo marcó P1:
// "tras registrarse, el usuario solo recibía un email semanal — nada lo
// traía de vuelta mañana".
//
// Idempotencia: una notificación por entrada abierta; se salta a quien ya
// recibió un DAILY_REFLECTION_REMINDER en las últimas 20h.
// Auth: Bearer ${CRON_SECRET} (Vercel cron lo envía automáticamente).
// Horario (vercel.json): 0 0 * * * UTC = 19:00 Ecuador/Colombia/Perú.
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
    title: "Cierra tu día con Rowi",
    message: "Una frase sobre tu día basta. Tu racha y tu Rowi te esperan.",
  },
  en: {
    title: "Close your day with Rowi",
    message: "One sentence about your day is enough. Your streak and your Rowi are waiting.",
  },
  pt: {
    title: "Feche seu dia com o Rowi",
    message: "Uma frase sobre o seu dia basta. Sua sequência e seu Rowi estão esperando.",
  },
  it: {
    title: "Chiudi la tua giornata con Rowi",
    message: "Basta una frase sulla tua giornata. La tua serie e il tuo Rowi ti aspettano.",
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
  const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000);

  try {
    // Día abierto sin cerrar: entrada reciente sin reflexión nocturna.
    const openEntries = await prisma.dailyLoopEntry.findMany({
      where: {
        createdAt: { gte: twentyHoursAgo },
        reflectionText: null,
      },
      select: {
        userId: true,
        user: { select: { active: true, preferredLang: true, language: true } },
      },
      take: 5000,
    });

    const candidates = openEntries.filter((e) => e.user?.active !== false);
    const userIds = [...new Set(candidates.map((e) => e.userId))];

    // Idempotencia: no repetir el nudge dentro de la misma ventana.
    const alreadyNudged = await prisma.notificationQueue.findMany({
      where: {
        userId: { in: userIds },
        type: "DAILY_REFLECTION_REMINDER",
        createdAt: { gte: twentyHoursAgo },
      },
      select: { userId: true },
    });
    const nudged = new Set(alreadyNudged.map((n: { userId: string }) => n.userId));

    let sent = 0;
    let skipped = 0;
    let failed = 0;
    const seen = new Set<string>();

    for (const entry of candidates) {
      if (seen.has(entry.userId)) continue;
      seen.add(entry.userId);
      if (nudged.has(entry.userId)) {
        skipped++;
        continue;
      }
      const locale = pickLocale(entry.user?.preferredLang ?? entry.user?.language);
      const copy = COPY[locale];
      try {
        await NotificationService.queue({
          userId: entry.userId,
          type: "DAILY_REFLECTION_REMINDER",
          title: copy.title,
          message: copy.message,
          actionUrl: "/today",
          metadata: { source: "cron.daily-reflection-reminder", locale },
        });
        sent++;
      } catch (err) {
        failed++;
        secureLog.error("[cron.daily-reflection-reminder] queue failed", err, {
          userId: entry.userId,
        });
      }
    }

    const ms = Date.now() - startedAt;
    secureLog.info("[cron.daily-reflection-reminder] done", {
      sent,
      skipped,
      failed,
      candidates: userIds.length,
      ms,
    });
    return NextResponse.json({ ok: true, sent, skipped, failed, candidates: userIds.length });
  } catch (err) {
    secureLog.error("[cron.daily-reflection-reminder] error", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
