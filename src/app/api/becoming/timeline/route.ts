/**
 * GET /api/becoming/timeline?cursor=YYYY-MM-DD&take=14
 *
 * MY BECOMING — la memoria viva (D3 del plan de remediación). Devuelve la
 * historia real del usuario, día a día, desde su DailyLoopEntry: con qué
 * emoción llegó, qué versión de sí mismo propuso el día, qué practicó y qué
 * reflexionó. Paginado por localDate (cursor = el localDate más antiguo de la
 * página anterior).
 *
 * En la primera página (sin cursor) incluye además los hitos del avatar
 * (AvatarMilestone) para que la UI los intercale en la línea de tiempo.
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { secureLog } from "@/lib/logging";

const DEFAULT_TAKE = 14;
const MAX_TAKE = 30;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "auth.unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "user.not_found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const cursorRaw = url.searchParams.get("cursor");
    const cursor = cursorRaw && DATE_RE.test(cursorRaw) ? cursorRaw : null;
    const takeRaw = Number(url.searchParams.get("take"));
    const take = Number.isFinite(takeRaw)
      ? Math.min(MAX_TAKE, Math.max(1, Math.floor(takeRaw)))
      : DEFAULT_TAKE;

    // Solo días con contenido real: un registro vacío no es memoria.
    const entries = await prisma.dailyLoopEntry.findMany({
      where: {
        userId: user.id,
        ...(cursor ? { localDate: { lt: cursor } } : {}),
        OR: [
          { reflectionText: { not: null } },
          { practiceText: { not: null } },
          { morningMood: { not: null } },
          { becomeIdentity: { not: null } },
        ],
      },
      orderBy: { localDate: "desc" },
      take: take + 1,
      select: {
        localDate: true,
        morningMood: true,
        morningIntensity: true,
        becomeSei: true,
        becomeIdentity: true,
        practiceText: true,
        practiceDone: true,
        reflectionText: true,
      },
    });

    const hasMore = entries.length > take;
    const page = hasMore ? entries.slice(0, take) : entries;
    const nextCursor = hasMore ? page[page.length - 1].localDate : null;

    // Hitos del avatar solo en la primera página (la UI los intercala).
    let milestones: {
      date: string;
      title: string;
      description: string | null;
      rarity: string;
      xpReward: number;
    }[] = [];
    if (!cursor) {
      const avatar = await prisma.avatarEvolution.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (avatar) {
        const rows = await prisma.avatarMilestone.findMany({
          where: { avatarId: avatar.id },
          orderBy: { unlockedAt: "desc" },
          take: 50,
          select: {
            title: true,
            description: true,
            rarity: true,
            xpReward: true,
            unlockedAt: true,
          },
        });
        milestones = rows.map((m) => ({
          date: m.unlockedAt.toISOString().slice(0, 10),
          title: m.title,
          description: m.description,
          rarity: m.rarity,
          xpReward: m.xpReward,
        }));
      }
    }

    return NextResponse.json({ ok: true, entries: page, nextCursor, milestones });
  } catch (e: unknown) {
    secureLog.error("becoming.timeline.failed", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
