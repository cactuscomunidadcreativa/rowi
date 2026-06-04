/**
 * 🔗 API: lista de vínculos (díadas) del usuario — la "lista de relaciones" de
 * la cadena SIA. GET /api/relationships
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { affinityAsGap } from "@/domains/affinity/lib/asGap";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const dyads = await prisma.relationshipDyad.findMany({
      where: { ownerUserId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        otherName: true,
        otherEmail: true,
        relationType: true,
        otherJoined: true,
        otherSeiDone: true,
        lastGapSummary: true,
      },
    });

    const relationships = dyads.map((d) => {
      const summary = (d.lastGapSummary ?? null) as { heat135?: number; heat100?: number } | null;
      const gap = summary ? affinityAsGap(summary) : null;
      return {
        id: d.id,
        name: d.otherName,
        relationType: d.relationType,
        otherJoined: d.otherJoined,
        otherSeiDone: d.otherSeiDone,
        attunement: gap ? { level: gap.level, step: gap.step, labelKey: gap.labelKey } : null,
      };
    });

    return NextResponse.json({ ok: true, relationships });
  } catch (e: any) {
    console.error("❌ GET /api/relationships:", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
