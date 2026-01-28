import { NextRequest, NextResponse } from "next/server";
import { N, clamp, avg, stddev } from "@/lib/math"; // 🔹 centraliza helpers
import { prisma } from "@/core/prisma";
import { normalizeProject } from "../utils"; // 🔹 lo compartimos entre subroutes

export const runtime = "nodejs";

/**
 * Calcula afinidad basada en competencias SEI (growth)
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const project = normalizeProject(url.searchParams.get("project"));
    const memberId = url.searchParams.get("memberId");
    const userId = url.searchParams.get("userId");

    if (!userId || !memberId) {
      return NextResponse.json({ ok: false, error: "userId y memberId requeridos" }, { status: 400 });
    }

    // === snapshots ===
    const [meSnap, memberSnap] = await Promise.all([
      prisma.eqSnapshot.findFirst({ where: { userId }, orderBy: { at: "desc" } }),
      prisma.eqSnapshot.findFirst({ where: { memberId }, orderBy: { at: "desc" } }),
    ]);

    if (!meSnap || !memberSnap) {
      return NextResponse.json({ ok: true, score: 0, note: "No hay snapshots válidos" });
    }

    const weights = { EL: 0.12, RP: 0.13, ACT: 0.15, NE: 0.15, IM: 0.1, OP: 0.1, EMP: 0.12, NG: 0.13 };

    const diffs: number[] = [], aVals: number[] = [], bVals: number[] = [];
    Object.keys(weights).forEach((k) => {
      const ak = N(meSnap[k as keyof typeof meSnap]);
      const bk = N(memberSnap[k as keyof typeof memberSnap]);
      if (ak != null) aVals.push(ak);
      if (bk != null) bVals.push(bk);
      if (ak != null && bk != null) diffs.push(Math.abs(ak - bk) * (weights[k as keyof typeof weights] ?? 0.125));
    });

    const aTot = avg(aVals) ?? 67.5;
    const bTot = avg(bVals) ?? 67.5;
    const mdWeighted = diffs.length ? diffs.reduce((p, c) => p + c, 0) / diffs.length : 0;
    const baseSim = clamp(135 - mdWeighted, 0, 135);
    const growth = clamp((aTot + bTot) / 2, 0, 135);
    const dispersion = ((stddev(aVals) ?? 0) + (stddev(bVals) ?? 0)) / 2;
    const dispPenalty = clamp(dispersion / 160, 0, 0.35);
    const score = clamp((0.55 * baseSim + 0.45 * growth) * (1 - dispPenalty), 0, 135);

    return NextResponse.json({ ok: true, project, score });
  } catch (e: any) {
    console.error("Growth affinity error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}