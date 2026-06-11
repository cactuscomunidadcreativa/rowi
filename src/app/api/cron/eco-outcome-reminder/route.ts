// ============================================================
// Cron: recordatorio de outcome ECO (F5 · Rowi Launch 1.0).
//
// El foso de datos es (mensaje → ¿funcionó?). El banner de /eco pregunta
// cuando el usuario vuelve; este cron pregunta a quien NO volvió: envíos
// con >48h sin feedback posterior reciben un nudge (push/in-app).
//
// Idempotencia: máximo un nudge por usuario cada 72h.
// Auth: Bearer ${CRON_SECRET}. Horario (vercel.json): 0 16 * * * UTC.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { NotificationService } from "@/lib/notifications";
import { secureLog } from "@/lib/logging";

export const runtime = "nodejs";
export const maxDuration = 300;

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
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

  try {
    // Envíos de la última semana con más de 48h de antigüedad.
    const sentMessages = await prisma.ecoMessage.findMany({
      where: {
        role: "sent",
        createdAt: { gte: sevenDaysAgo, lte: fortyEightHoursAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 2000,
      select: {
        createdAt: true,
        thread: {
          select: {
            id: true,
            ownerUserId: true,
            dyad: { select: { otherName: true } },
          },
        },
      },
    });

    // Sin feedback POSTERIOR al envío en el mismo hilo.
    let sent = 0;
    let skipped = 0;
    let failed = 0;
    const seenUsers = new Set<string>();

    // Un solo nudge por usuario por corrida + respeta la ventana de 72h.
    const userIds = [...new Set(sentMessages.map((m) => m.thread.ownerUserId))];
    const recentNudges = await prisma.notificationQueue.findMany({
      where: {
        userId: { in: userIds },
        type: "ECO_OUTCOME_REMINDER",
        createdAt: { gte: seventyTwoHoursAgo },
      },
      select: { userId: true },
    });
    const nudged = new Set(recentNudges.map((n: { userId: string }) => n.userId));

    for (const msg of sentMessages) {
      const userId = msg.thread.ownerUserId;
      if (seenUsers.has(userId) || nudged.has(userId)) {
        skipped++;
        continue;
      }
      const feedbackAfter = await prisma.ecoMessage.findFirst({
        where: {
          threadId: msg.thread.id,
          role: "feedback",
          createdAt: { gt: msg.createdAt },
        },
        select: { id: true },
      });
      if (feedbackAfter) {
        skipped++;
        continue;
      }
      seenUsers.add(userId);
      const otherName = msg.thread.dyad?.otherName;
      try {
        await NotificationService.queue({
          userId,
          type: "ECO_OUTCOME_REMINDER",
          title: "¿Funcionó tu mensaje?",
          message: `Hace un par de días enviaste un mensaje con ECO${otherName ? ` a ${otherName}` : ""}. Contarnos cómo fue afina los próximos.`,
          actionUrl: "/eco",
          metadata: { source: "cron.eco-outcome-reminder" },
        });
        sent++;
      } catch (err) {
        failed++;
        secureLog.error("[cron.eco-outcome-reminder] queue failed", err, { userId });
      }
    }

    const ms = Date.now() - startedAt;
    secureLog.info("[cron.eco-outcome-reminder] done", { sent, skipped, failed, ms });
    return NextResponse.json({ ok: true, sent, skipped, failed });
  } catch (err) {
    secureLog.error("[cron.eco-outcome-reminder] error", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
