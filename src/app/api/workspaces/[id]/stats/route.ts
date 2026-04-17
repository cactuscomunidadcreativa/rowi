// src/app/api/workspaces/[id]/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { canAccessWorkspace } from "@/lib/workspace/permissions";

export const runtime = "nodejs";

/**
 * GET /api/workspaces/[id]/stats
 * Calcula stats agregados sobre los miembros del workspace.
 * Usado por dashboard, benchmark, affinity.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { allowed } = await canAccessWorkspace(token.sub, id);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Recoger todos los snapshots SEI del workspace (via CommunityMember)
    const members = await prisma.communityMember.findMany({
      where: { communityId: id },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        country: true,
        brainStyle: true,
        role: true,
        group: true,
        snapshots: {
          orderBy: { at: "desc" },
          take: 1,
          select: {
            K: true,
            C: true,
            G: true,
            EL: true,
            RP: true,
            ACT: true,
            NE: true,
            IM: true,
            OP: true,
            EMP: true,
            NG: true,
            overall4: true,
            brainStyle: true,
          },
        },
      },
    });

    const withSei = members.filter((m) => m.snapshots[0]);
    const total = members.length;

    if (withSei.length === 0) {
      return NextResponse.json({
        total,
        withSei: 0,
        avgEQ: null,
        pursuits: null,
        competencies: null,
        brainStyles: {},
        countries: {},
        roles: {},
      });
    }

    // Calcular promedios
    const avg = (key: string): number | null => {
      const vals = withSei
        .map((m) => (m.snapshots[0] as any)[key])
        .filter((v): v is number => typeof v === "number" && v > 0);
      if (vals.length === 0) return null;
      return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    };

    const pursuits = {
      know: avg("K"),
      choose: avg("C"),
      give: avg("G"),
    };
    const competencies = {
      EL: avg("EL"),
      RP: avg("RP"),
      ACT: avg("ACT"),
      NE: avg("NE"),
      IM: avg("IM"),
      OP: avg("OP"),
      EMP: avg("EMP"),
      NG: avg("NG"),
    };
    const avgEQ = avg("overall4");

    // Distribucion de brain styles
    const brainStyles: Record<string, number> = {};
    for (const m of withSei) {
      const bs = m.snapshots[0].brainStyle || m.brainStyle;
      if (bs) brainStyles[bs] = (brainStyles[bs] || 0) + 1;
    }

    // Distribucion de paises
    const countries: Record<string, number> = {};
    for (const m of members) {
      if (m.country) countries[m.country] = (countries[m.country] || 0) + 1;
    }

    // Distribucion de roles
    const roles: Record<string, number> = {};
    for (const m of members) {
      if (m.role) roles[m.role] = (roles[m.role] || 0) + 1;
    }

    return NextResponse.json({
      total,
      withSei: withSei.length,
      avgEQ,
      pursuits,
      competencies,
      brainStyles,
      countries,
      roles,
    });
  } catch (err: any) {
    console.error("GET /api/workspaces/[id]/stats error:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}
