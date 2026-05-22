/**
 * GET /api/learning/microlearnings/list?source=eqe
 *
 * Devuelve las micro-lessons activas agrupadas por parentKey (SEI
 * competency). Por defecto filtra por content.source = "EQE" para
 * devolver el track del programa Six Seconds adaptado 18+.
 *
 * Incluye el estado UserMicroLearning del caller (status, progress,
 * pointsEarned) para que la UI pueda marcar lo completado.
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    const user = email
      ? await prisma.user.findUnique({ where: { email }, select: { id: true } })
      : null;

    const url = new URL(req.url);
    const source = url.searchParams.get("source") ?? "EQE";

    const lessons = await prisma.microLearning.findMany({
      where: {
        isActive: true,
        category: "COMPETENCY",
      },
      orderBy: [{ parentKey: "asc" }, { order: "asc" }],
      select: {
        id: true,
        slug: true,
        parentKey: true,
        title: true,
        titleEN: true,
        description: true,
        descriptionEN: true,
        duration: true,
        difficulty: true,
        points: true,
        isFeatured: true,
        content: true,
      },
    });

    const filtered = lessons.filter((l) => {
      const c = l.content as { source?: string } | null;
      return c?.source === source;
    });

    let progressBySlug = new Map<string, { status: string; progress: number; pointsEarned: number }>();
    if (user) {
      const progress = await prisma.userMicroLearning.findMany({
        where: {
          userId: user.id,
          microLearning: { slug: { in: filtered.map((l) => l.slug) } },
        },
        select: {
          microLearning: { select: { slug: true } },
          status: true,
          progress: true,
          pointsEarned: true,
        },
      });
      progressBySlug = new Map(
        progress.map((p) => [
          p.microLearning.slug,
          { status: String(p.status), progress: p.progress, pointsEarned: p.pointsEarned },
        ]),
      );
    }

    const items = filtered.map((l) => ({
      slug: l.slug,
      sei: l.parentKey,
      title: l.title,
      titleEN: l.titleEN,
      description: l.description,
      descriptionEN: l.descriptionEN,
      durationMin: l.duration,
      difficulty: l.difficulty,
      points: l.points,
      isFeatured: l.isFeatured,
      track: (l.content as { track?: string } | null)?.track ?? null,
      progress: progressBySlug.get(l.slug) ?? null,
    }));

    return NextResponse.json({ ok: true, items });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/learning/microlearnings/list error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
