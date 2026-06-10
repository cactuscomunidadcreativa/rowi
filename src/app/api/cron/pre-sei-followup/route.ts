// ============================================================
// Cron: Emotional Mirror follow-up ("te escribo mañana").
//
// Envía la micro-práctica del día siguiente a quien dejó su email tras el
// Pre-SEI público (PreSeiSession.followUpEmail). Ventana: sesiones de entre
// 18h y 7 días — ni el mismo día (la promesa es "mañana") ni leads fríos.
// Idempotente: followUpSentAt marca el envío; un solo correo por sesión.
//
// Auth: Bearer ${CRON_SECRET} (Vercel cron lo envía automáticamente).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { sendContextNotification, type Locale } from "@/lib/email/sendContextNotification";
import { mirrorPair } from "@/lib/pre-sei/mirror";
import { secureLog } from "@/lib/logging";
import es from "@/lib/i18n/locales/es.json";
import en from "@/lib/i18n/locales/en.json";
import pt from "@/lib/i18n/locales/pt.json";
import it from "@/lib/i18n/locales/it.json";

export const runtime = "nodejs";
export const maxDuration = 300;

const LOCALES: Record<Locale, Record<string, string>> = {
  es: es as Record<string, string>,
  en: en as Record<string, string>,
  pt: pt as Record<string, string>,
  it: it as Record<string, string>,
};

const BATCH = 200;

function resolveLocale(raw: string | null | undefined): Locale {
  return raw === "en" || raw === "pt" || raw === "it" ? raw : "es";
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const now = Date.now();
    const sessions = await prisma.preSeiSession.findMany({
      where: {
        followUpEmail: { not: null },
        followUpSentAt: null,
        createdAt: {
          lte: new Date(now - 18 * 60 * 60 * 1000),
          gte: new Date(now - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: "asc" },
      take: BATCH,
      select: { id: true, token: true, followUpEmail: true, locale: true, result: true },
    });

    let sent = 0;
    let skipped = 0;
    for (const s of sessions) {
      const locale = resolveLocale(s.locale);
      const dict = LOCALES[locale];
      const result = s.result as { competencies?: Record<string, number> } | null;
      const pair = result?.competencies ? mirrorPair(result.competencies) : null;
      const action = pair ? dict[`preSei.mirror.action.${pair.blind}`] ?? null : null;

      const res = await sendContextNotification({
        to: s.followUpEmail as string,
        kind: "preSei.followup",
        detail: action,
        ctaUrl: `https://www.rowiia.com/register?preSeiToken=${encodeURIComponent(s.token)}`,
        locale,
      });

      if (res.ok) {
        // skipped=true significa RESEND_API_KEY ausente: no marcar como
        // enviado, se reintenta cuando haya credencial.
        if (res.skipped) {
          skipped++;
          continue;
        }
        await prisma.preSeiSession.update({
          where: { id: s.id },
          data: { followUpSentAt: new Date() },
        });
        sent++;
      } else {
        skipped++;
      }
    }

    secureLog.info("cron.pre_sei_followup", { candidates: sessions.length, sent, skipped });
    return NextResponse.json({ ok: true, candidates: sessions.length, sent, skipped });
  } catch (e: unknown) {
    secureLog.error("cron.pre_sei_followup.failed", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
