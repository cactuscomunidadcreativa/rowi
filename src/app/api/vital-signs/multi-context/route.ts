/**
 * GET /api/vital-signs/multi-context
 *
 * Devuelve, para el usuario autenticado, los agregados inferidos de:
 *  - sus equipos (RowiCommunity → TVS proxy)
 *  - sus organizaciones (Tenant → OVS proxy)
 *  - sus familias (FamilyRelation → FVS proxy)
 *
 * Beta-gated: solo accesible a miembros de tenants en
 * BETA_MULTI_CTX_TENANT_SLUGS. Para los demás devuelve { ok: true, beta: false }.
 *
 * Privacy floor N≥5 aplicado en el agregador. Las cards con N<5 vienen con
 * `suppressed: true` para que la UI muestre placeholder, no scores.
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { userHasBetaMultiContext } from "@/lib/vital-signs/beta";
import {
  aggregateInferredVitalSigns,
  type AggregateResult,
} from "@/lib/vital-signs/aggregate";

interface ContextCard {
  scope: "team" | "org" | "family";
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
}

function toCard(r: AggregateResult, slug?: string): ContextCard {
  const ranked = r.drivers
    .filter((d): d is typeof d & { scoreMean: number } => typeof d.scoreMean === "number")
    .sort((a, b) => b.scoreMean - a.scoreMean);
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];
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

    const beta = await userHasBetaMultiContext(user.id);
    if (!beta) {
      return NextResponse.json({ ok: true, beta: false, teams: [], orgs: [], families: [] });
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

    // For family scope, the subjectId is the family owner — we anchor on the
    // current user when they own relations, or on the owner when they are the
    // related side. Deduplicate by owner.
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

    const [orgs, teams, families] = await Promise.all([
      Promise.all(orgPromises),
      Promise.all(teamPromises),
      Promise.all(familyPromises),
    ]);

    return NextResponse.json({ ok: true, beta: true, teams, orgs, families });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/vital-signs/multi-context error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
