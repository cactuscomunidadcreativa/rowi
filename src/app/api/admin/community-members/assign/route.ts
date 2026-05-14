// src/app/api/admin/community-members/assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";

export const runtime = "nodejs";

/**
 * POST /api/admin/community-members/assign
 * Body: { memberIds: string[], communityId: string }
 *
 * Bulk-assigns CommunityMember rows to a community. Safety:
 *   - The admin must have access to the destination community's tenant.
 *   - Each member must belong to that same tenant (we don't move
 *     people across tenants in a single click — that's a different
 *     operation).
 *
 * Returns counts of assigned/skipped so the UI can show what happened.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body JSON inválido" },
      { status: 400 },
    );
  }

  const memberIds: string[] = Array.isArray(body.memberIds)
    ? body.memberIds.filter((x: unknown) => typeof x === "string")
    : [];
  const communityId = typeof body.communityId === "string" ? body.communityId : null;

  if (!communityId) {
    return NextResponse.json(
      { ok: false, error: "communityId requerido" },
      { status: 400 },
    );
  }
  if (memberIds.length === 0) {
    return NextResponse.json(
      { ok: false, error: "memberIds requerido (array no vacío)" },
      { status: 400 },
    );
  }

  const community = await prisma.rowiCommunity.findUnique({
    where: { id: communityId },
    select: { id: true, tenantId: true },
  });
  if (!community) {
    return NextResponse.json(
      { ok: false, error: "Community no encontrada" },
      { status: 404 },
    );
  }
  if (!community.tenantId) {
    return NextResponse.json(
      { ok: false, error: "La community no está vinculada a un tenant" },
      { status: 400 },
    );
  }

  // Scope check: caller must be able to admin community.tenantId.
  if (auth.scope.type === "tenant" && auth.scope.id !== community.tenantId) {
    return NextResponse.json(
      { ok: false, error: "Community fuera de tu scope" },
      { status: 403 },
    );
  }
  if (auth.scope.type === "hub") {
    const hub = await prisma.hub.findUnique({
      where: { id: auth.scope.id! },
      select: { tenantId: true },
    });
    if (hub?.tenantId !== community.tenantId) {
      return NextResponse.json(
        { ok: false, error: "Community fuera de tu scope" },
        { status: 403 },
      );
    }
  }
  if (auth.scope.type === "superhub") {
    const sh = await prisma.superHub.findUnique({
      where: { id: auth.scope.id! },
      select: { tenants: { select: { id: true } } },
    });
    const tids = (sh?.tenants || []).map((t) => t.id);
    if (!tids.includes(community.tenantId)) {
      return NextResponse.json(
        { ok: false, error: "Community fuera de tu scope" },
        { status: 403 },
      );
    }
  }

  // Only flip members that already belong to this tenant. Cross-tenant
  // moves are intentionally blocked here.
  const eligible = await prisma.communityMember.findMany({
    where: {
      id: { in: memberIds },
      tenantId: community.tenantId,
    },
    select: { id: true },
  });
  const eligibleIds = eligible.map((m) => m.id);

  if (eligibleIds.length === 0) {
    return NextResponse.json({
      ok: true,
      assigned: 0,
      skipped: memberIds.length,
      reason:
        "Ningún miembro pertenece al tenant de la community (cross-tenant blocked).",
    });
  }

  const updated = await prisma.communityMember.updateMany({
    where: { id: { in: eligibleIds } },
    data: { communityId },
  });

  return NextResponse.json({
    ok: true,
    assigned: updated.count,
    skipped: memberIds.length - eligibleIds.length,
  });
}
