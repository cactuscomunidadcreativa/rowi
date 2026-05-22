/**
 * GET /api/vital-signs/multi-context
 *
 * Devuelve, para el usuario autenticado, los agregados inferidos de:
 *  - sus equipos (RowiCommunity → TVS proxy)
 *  - sus organizaciones (Tenant → OVS proxy)
 *  - sus familias (FamilyRelation → FVS proxy)
 *  - la humanidad Rowi (toda la base con consent analytics → OVS Rowiverse)
 *
 * Sin beta gate: la vista aplica a todos. Cuando el agregado no es ground
 * truth oficial (es decir, casi siempre hoy), la UI muestra "Inferencia v0
 * — no es OVS / TVS oficial".
 *
 * Privacy floor N≥5 aplicado en el agregador. Cards con N<5 vienen con
 * `suppressed: true` para que la UI muestre placeholder, no scores.
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import {
  aggregateInferredVitalSigns,
  type AggregateResult,
} from "@/lib/vital-signs/aggregate";
import { ROWI_ARCHETYPES } from "@/lib/vital-signs/catalog";

interface ContextCard {
  scope: "team" | "org" | "family" | "world";
  subjectId: string;
  subjectName: string;
  subjectSlug?: string;
  suppressed: boolean;
  n: number;
  nTotal: number;
  overallMean: number | null;
  engagementIndex: number | null;
  topDriver: { code: string; esName: string; enName: string; scoreMean: number } | null;
  bottomDriver: { code: string; esName: string; enName: string; scoreMean: number } | null;
  archetype: {
    quadrant: "LINTERNA" | "MAPA" | "BOTIQUIN" | "BOTAS";
    esName: string;
    enName: string;
    esTagline: string;
    enTagline: string;
    emoji: string;
  } | null;
  outcomes: Array<{ code: string; esName: string; enName: string; scoreMean: number | null }>;
}

function toCard(r: AggregateResult, slug?: string): ContextCard {
  const ranked = r.drivers
    .filter((d): d is typeof d & { scoreMean: number } => typeof d.scoreMean === "number")
    .sort((a, b) => b.scoreMean - a.scoreMean);
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];
  const arch = r.dominantQuadrant ? ROWI_ARCHETYPES[r.dominantQuadrant] : null;
  return {
    scope: r.scope,
    subjectId: r.subjectId,
    subjectName: r.subjectName,
    subjectSlug: slug,
    suppressed: r.suppressed,
    n: r.n,
    nTotal: r.nTotal,
    overallMean: r.overallMean,
    engagementIndex: r.engagementIndex,
    topDriver: top
      ? { code: top.code, esName: top.esName, enName: top.enName, scoreMean: top.scoreMean }
      : null,
    bottomDriver:
      bottom && bottom !== top
        ? {
            code: bottom.code,
            esName: bottom.esName,
            enName: bottom.enName,
            scoreMean: bottom.scoreMean,
          }
        : null,
    archetype: arch && r.dominantQuadrant
      ? {
          quadrant: r.dominantQuadrant,
          esName: arch.esName,
          enName: arch.enName,
          esTagline: arch.esTagline,
          enTagline: arch.enTagline,
          emoji: arch.emoji,
        }
      : null,
    outcomes: r.outcomes,
  };
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const [memberships, communityMemberships, familyRelations] = await Promise.all([
      prisma.membership.findMany({
        where: { userId: user.id },
        select: { tenantId: true, tenant: { select: { name: true, slug: true } } },
      }),
      prisma.rowiCommunityUser.findMany({
        where: { userId: user.id },
        select: {
          communityId: true,
          community: { select: { name: true, slug: true } },
        },
      }),
      prisma.familyRelation.findMany({
        where: {
          OR: [
            { ownerId: user.id, consentStatus: "accepted" },
            { relatedUserId: user.id, consentStatus: "accepted" },
          ],
        },
        select: { ownerId: true, relatedUserId: true, relationship: true, relatedName: true },
      }),
    ]);

    const orgPromises = memberships.map((m) =>
      aggregateInferredVitalSigns({
        scope: "org",
        subjectId: m.tenantId,
        subjectName: m.tenant.name,
      }).then((r) => toCard(r, m.tenant.slug)),
    );

    const teamPromises = communityMemberships.map((c) =>
      aggregateInferredVitalSigns({
        scope: "team",
        subjectId: c.communityId,
        subjectName: c.community.name,
      }).then((r) => toCard(r, c.community.slug)),
    );

    const familyOwners = new Map<string, string>();
    for (const r of familyRelations) {
      if (r.ownerId === user.id) {
        familyOwners.set(user.id, r.relatedName ?? "Mi familia");
      } else if (r.relatedUserId === user.id) {
        familyOwners.set(r.ownerId, r.relatedName ?? "Familia");
      }
    }
    const familyPromises = Array.from(familyOwners.entries()).map(([ownerId, name]) =>
      aggregateInferredVitalSigns({
        scope: "family",
        subjectId: ownerId,
        subjectName: name,
      }).then((r) => toCard(r)),
    );

    const worldPromise = aggregateInferredVitalSigns({
      scope: "world",
      subjectId: "rowiverse",
      subjectName: "Rowiverse",
    }).then((r) => toCard(r));

    const [orgs, teams, families, world] = await Promise.all([
      Promise.all(orgPromises),
      Promise.all(teamPromises),
      Promise.all(familyPromises),
      worldPromise,
    ]);

    return NextResponse.json({ ok: true, teams, orgs, families, world });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/vital-signs/multi-context error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
