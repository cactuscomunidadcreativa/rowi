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

    // Mismas dos fuentes que /members: CommunityMember (CSV/manual) +
    // RowiCommunityUser (usuarios con cuenta y sus EqSnapshots propios)
    const snapshotSelect = {
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
    } as const;

    const [communityMembers, rowiMembers] = await Promise.all([
      prisma.communityMember.findMany({
        where: { communityId: id },
        select: {
          id: true,
          country: true,
          brainStyle: true,
          role: true,
          snapshots: {
            orderBy: { at: "desc" },
            take: 1,
            select: snapshotSelect,
          },
        },
      }),
      prisma.rowiCommunityUser.findMany({
        where: { communityId: id },
        select: {
          id: true,
          role: true,
          user: {
            select: {
              country: true,
              eqSnapshots: {
                orderBy: { at: "desc" },
                take: 1,
                select: snapshotSelect,
              },
            },
          },
        },
      }),
    ]);

    const members = [
      ...communityMembers.map((m) => ({
        country: m.country,
        brainStyle: m.brainStyle,
        role: m.role,
        snapshot: m.snapshots[0] || null,
      })),
      ...rowiMembers
        .filter((rm) => rm.user)
        .map((rm) => ({
          country: rm.user!.country,
          brainStyle: rm.user!.eqSnapshots[0]?.brainStyle || null,
          role: rm.role || "member",
          snapshot: rm.user!.eqSnapshots[0] || null,
        })),
    ];

    const withSei = members.filter((m) => m.snapshot);
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
        .map((m) => (m.snapshot as any)[key])
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
      const bs = m.snapshot!.brainStyle || m.brainStyle;
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
