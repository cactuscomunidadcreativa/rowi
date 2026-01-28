// src/app/api/eq/snapshots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase() || null;
    if (!email) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ ok:true, current:null, history:[] });

    // actual preferente; si no hay, el último en general
    const lastActual = await prisma.eqSnapshot.findFirst({
      where: { userId: user.id, dataset: "actual" },
      orderBy: { at: "desc" },
    });
    const lastAny = await prisma.eqSnapshot.findFirst({
      where: { userId: user.id },
      orderBy: { at: "desc" },
    });
    const current = lastActual ?? lastAny ?? null;

    // histórico (solo meta)
    const history = await prisma.eqSnapshot.findMany({
      where: { userId: user.id },
      select: { id:true, at:true, dataset:true },
      orderBy: { at: "desc" },
      take: 50,
    });

    if (!current) return NextResponse.json({ ok:true, current:null, history });

    const [outcomes, subfactors, talents] = await Promise.all([
      prisma.eqOutcomeSnapshot.findMany({
        where: { snapshotId: current.id },
        select: { key:true, score:true },
        orderBy: { key: "asc" },
      }),
      prisma.eqSubfactorSnapshot.findMany({
        where: { snapshotId: current.id },
        select: { key:true, score:true },
        orderBy: { key: "asc" },
      }),
      prisma.talentSnapshot.findMany({
        where: { snapshotId: current.id },
        select: { key:true, score:true },
        orderBy: { key: "asc" },
      }),
    ]);

    const cur = {
      at: current.at, dataset: current.dataset,
      brainStyle: current.brainStyle ?? null,
      K: current.K, C: current.C, G: current.G,
      EL: current.EL, RP: current.RP, ACT: current.ACT, NE: current.NE,
      IM: current.IM, OP: current.OP, EMP: current.EMP, NG: current.NG,
      outcomes, subfactors, talents,
    };

    return NextResponse.json({ ok:true, current: cur, history });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || "Error" }, { status:500 });
  }
}