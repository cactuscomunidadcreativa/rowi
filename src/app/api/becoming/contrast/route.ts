/**
 * GET /api/becoming/contrast?days=30|60|90
 *
 * MY BECOMING — el contraste honesto yo-vs-yo-pasado. Compara al usuario
 * consigo mismo hace N días vs hoy. NO devuelve un "Becoming Score" numérico:
 * mostrar un número inventado traicionaría "Track Becoming". Solo comparación
 * real entre dos puntos en el tiempo + la actividad de Becoming en la ventana.
 *
 * Devuelve:
 *  - competencies: por cada SEI, { past, now, delta } cuando hay snapshots que
 *    cruzan la ventana (SEI formal o mini-SEI). null si no hay base comparable.
 *  - practice: { reflections, practicesDone, daysWithEntry } en la ventana.
 *  - hasContrast: si hay suficiente historia para un contraste honesto.
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import type { SeiKey } from "@/lib/vital-signs/catalog";

const SEI_KEYS: SeiKey[] = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];
const ALLOWED_DAYS = [30, 60, 90];

type CompRow = Record<SeiKey, number | null>;

function compFrom(snap: Partial<Record<SeiKey, number | null>> | null): CompRow | null {
  if (!snap) return null;
  const row = {} as CompRow;
  let any = false;
  for (const k of SEI_KEYS) {
    const v = snap[k];
    row[k] = typeof v === "number" ? v : null;
    if (typeof v === "number") any = true;
  }
  return any ? row : null;
}

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

    const daysParam = Number(new URL(req.url).searchParams.get("days"));
    const days = ALLOWED_DAYS.includes(daysParam) ? daysParam : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Snapshots EQ que cruzan la ventana: el más reciente (now) y el más
    // cercano-anterior a `since` (past). Honesto: compara mismo usuario.
    const [latestSnap, pastSnap, loopEntries] = await Promise.all([
      prisma.eqSnapshot.findFirst({
        where: { userId: user.id },
        orderBy: { at: "desc" },
        select: { at: true, EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true },
      }),
      prisma.eqSnapshot.findFirst({
        where: { userId: user.id, at: { lte: since } },
        orderBy: { at: "desc" },
        select: { at: true, EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true },
      }),
      prisma.dailyLoopEntry.findMany({
        where: { userId: user.id, createdAt: { gte: since } },
        select: { practiceDone: true, reflectionText: true },
      }),
    ]);

    const nowComp = compFrom(latestSnap);
    const pastComp = compFrom(pastSnap);

    let competencies: { sei: SeiKey; past: number | null; now: number | null; delta: number | null }[] | null = null;
    if (nowComp && pastComp && latestSnap && pastSnap && latestSnap.at > pastSnap.at) {
      competencies = SEI_KEYS.map((k) => {
        const past = pastComp[k];
        const now = nowComp[k];
        const delta = typeof past === "number" && typeof now === "number" ? now - past : null;
        return { sei: k, past, now, delta };
      });
    }

    const reflections = loopEntries.filter((e) => !!e.reflectionText).length;
    const practicesDone = loopEntries.filter((e) => e.practiceDone).length;
    const daysWithEntry = loopEntries.length;

    return NextResponse.json({
      ok: true,
      days,
      // Sin Becoming Score: solo contraste honesto + actividad de Becoming.
      competencies, // null si no hay dos snapshots que crucen la ventana
      practice: { reflections, practicesDone, daysWithEntry },
      hasContrast: !!competencies || daysWithEntry > 0,
    });
  } catch (e: unknown) {
    console.error("/api/becoming/contrast error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
