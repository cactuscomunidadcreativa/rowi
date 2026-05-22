/**
 * GET /api/vital-signs/context/[scope]/[id]
 *
 * Detalle completo del agregado inferido de un contexto único: TODOS los
 * drivers, PPs, outcomes, orientations, 8 SEI competencies y engagement
 * index. Esto materializa el "capital emocional disponible" — el
 * inventario Six Seconds que tiene la organización/equipo/familia.
 *
 * Authorization: el caller debe ser miembro del scope (Tenant /
 * RowiCommunity / FamilyRelation). World es accesible a cualquier auth.
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import {
  aggregateInferredVitalSigns,
  type AggregateScope,
} from "@/lib/vital-signs/aggregate";

async function resolveSubjectName(
  scope: AggregateScope,
  subjectId: string,
): Promise<string | null> {
  if (scope === "team") {
    const c = await prisma.rowiCommunity.findUnique({
      where: { id: subjectId },
      select: { name: true },
    });
    return c?.name ?? null;
  }
  if (scope === "org") {
    const t = await prisma.tenant.findUnique({
      where: { id: subjectId },
      select: { name: true },
    });
    return t?.name ?? null;
  }
  if (scope === "family") {
    const owner = await prisma.user.findUnique({
      where: { id: subjectId },
      select: { name: true },
    });
    return owner?.name ?? "Familia";
  }
  if (scope === "world") return "Rowiverse";
  return null;
}

async function userBelongsToScope(
  userId: string,
  scope: AggregateScope,
  subjectId: string,
): Promise<boolean> {
  if (scope === "world") return true;
  if (scope === "team") {
    const m = await prisma.rowiCommunityUser.findFirst({
      where: { userId, communityId: subjectId },
      select: { id: true },
    });
    return !!m;
  }
  if (scope === "org") {
    const m = await prisma.membership.findFirst({
      where: { userId, tenantId: subjectId },
      select: { id: true },
    });
    return !!m;
  }
  // family: ownerId must be the user or have an accepted relation
  if (userId === subjectId) return true;
  const rel = await prisma.familyRelation.findFirst({
    where: {
      ownerId: subjectId,
      relatedUserId: userId,
      consentStatus: "accepted",
    },
    select: { id: true },
  });
  return !!rel;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scope: string; id: string }> },
) {
  try {
    const { scope: rawScope, id } = await params;
    const scope = rawScope as AggregateScope;
    if (!["team", "org", "family", "world"].includes(scope)) {
      return NextResponse.json({ ok: false, error: "Invalid scope" }, { status: 400 });
    }

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

    const subjectId = scope === "world" ? "rowiverse" : id;

    const belongs = await userBelongsToScope(user.id, scope, subjectId);
    if (!belongs) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const subjectName = (await resolveSubjectName(scope, subjectId)) ?? "—";

    const result = await aggregateInferredVitalSigns({
      scope,
      subjectId,
      subjectName,
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/vital-signs/context/[scope]/[id] error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
