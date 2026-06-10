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
    //
    // Cascada (misma que avatar-evolution): SEI formal → mini-SEI → lectura
    // única. Nunca se mezclan fuentes en un mismo par (escalas distintas:
    // SEI ~65-135, mini-SEI 1-5). El SEI formal se busca por userId O por el
    // email de la sesión — los snapshots importados por CSV/xlsx a veces solo
    // traen email.
    const seiWhere = {
      OR: [{ userId: user.id }, { email: { equals: email, mode: "insensitive" as const } }],
    };
    const seiSelect = {
      at: true, EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true,
    } as const;
    const [latestSnap, pastSnap, latestMini, pastMini, loopEntries] = await Promise.all([
      prisma.eqSnapshot.findFirst({
        where: seiWhere,
        orderBy: { at: "desc" },
        select: seiSelect,
      }),
      prisma.eqSnapshot.findFirst({
        where: { ...seiWhere, at: { lte: since } },
        orderBy: { at: "desc" },
        select: seiSelect,
      }),
      prisma.miniSeiSnapshot.findFirst({
        where: { userId: user.id },
        orderBy: { takenAt: "desc" },
        select: { takenAt: true, competencyProfile: true },
      }),
      prisma.miniSeiSnapshot.findFirst({
        where: { userId: user.id, takenAt: { lte: since } },
        orderBy: { takenAt: "desc" },
        select: { takenAt: true, competencyProfile: true },
      }),
      prisma.dailyLoopEntry.findMany({
        where: { userId: user.id, createdAt: { gte: since } },
        select: { practiceDone: true, reflectionText: true },
      }),
    ]);

    const nowComp = compFrom(latestSnap);
    const pastComp = compFrom(pastSnap);
    const nowMini = compFrom(latestMini?.competencyProfile as Partial<Record<SeiKey, number | null>> | null);
    const pastMiniComp = compFrom(pastMini?.competencyProfile as Partial<Record<SeiKey, number | null>> | null);

    const buildRows = (past: CompRow, now: CompRow) =>
      SEI_KEYS.map((k) => {
        const p = past[k];
        const n = now[k];
        const delta =
          typeof p === "number" && typeof n === "number"
            ? Math.round((n - p) * 10) / 10
            : null;
        return { sei: k, past: p, now: n, delta };
      });

    let competencies: { sei: SeiKey; past: number | null; now: number | null; delta: number | null }[] | null = null;
    let current: { sei: SeiKey; now: number | null }[] | null = null;
    let source: "sei" | "mini_sei" | null = null;

    if (nowComp && pastComp && latestSnap && pastSnap && latestSnap.at > pastSnap.at) {
      // Par de SEI formales que cruza la ventana.
      competencies = buildRows(pastComp, nowComp);
      source = "sei";
    } else if (nowMini && pastMiniComp && latestMini && pastMini && latestMini.takenAt > pastMini.takenAt) {
      // Par de mini-SEI (Rowi Test mensual) — indicativo pero comparable.
      competencies = buildRows(pastMiniComp, nowMini);
      source = "mini_sei";
    } else if (nowComp) {
      // Solo UNA lectura formal: mostrarla sin delta en vez de pantalla vacía.
      current = SEI_KEYS.map((k) => ({ sei: k, now: nowComp[k] }));
      source = "sei";
    } else if (nowMini) {
      current = SEI_KEYS.map((k) => ({ sei: k, now: nowMini[k] }));
      source = "mini_sei";
    }

    const reflections = loopEntries.filter((e) => !!e.reflectionText).length;
    const practicesDone = loopEntries.filter((e) => e.practiceDone).length;
    const daysWithEntry = loopEntries.length;

    return NextResponse.json({
      ok: true,
      days,
      // Sin Becoming Score: solo contraste honesto + actividad de Becoming.
      competencies, // null si no hay dos snapshots comparables que crucen la ventana
      current, // la lectura más reciente cuando aún no hay par para contrastar
      source, // "sei" (formal) | "mini_sei" (indicativo) | null
      practice: { reflections, practicesDone, daysWithEntry },
      hasContrast: !!competencies || daysWithEntry > 0,
    });
  } catch (e: unknown) {
    console.error("/api/becoming/contrast error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
