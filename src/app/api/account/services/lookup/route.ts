// src/app/api/account/services/lookup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/**
 * GET /api/account/services/lookup?kind=user|tenant|community|organization&q=<query>
 *
 * Returns up to 20 candidate entities matching the query, in the shape
 * { id, label, hint? }. Used by the /settings/services UI as an
 * autocomplete picker so the user doesn't have to paste raw IDs.
 *
 * Visibility model:
 *   - user:         search by email or name; returns email as hint.
 *                    Self is excluded.
 *   - tenant:       any tenant the caller can see (memberships +
 *                    primaryTenant). Tenant admins see only their
 *                    tenant; SuperAdmin sees all.
 *   - community:    workspaces the caller is in (via RowiCommunityUser)
 *                    or that belong to their accessible tenants.
 *   - organization: org memberships the caller has.
 */
export async function GET(req: NextRequest) {
  const auth = await getServerAuthUser();
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "No autenticado" },
      { status: 401 },
    );
  }

  const url = new URL(req.url);
  const kind = (url.searchParams.get("kind") || "").toLowerCase();
  const q = (url.searchParams.get("q") || "").trim();

  if (q.length < 2) {
    return NextResponse.json({ ok: true, candidates: [] });
  }

  const search = { contains: q, mode: "insensitive" as const };

  try {
    if (kind === "user") {
      const rows = await prisma.user.findMany({
        where: {
          AND: [
            { id: { not: auth.id } },
            {
              OR: [{ email: search }, { name: search }],
            },
          ],
        },
        take: 20,
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true },
      });
      return NextResponse.json({
        ok: true,
        candidates: rows.map((u) => ({
          id: u.id,
          label: u.name || u.email,
          hint: u.email,
        })),
      });
    }

    if (kind === "tenant") {
      // Tenants the caller can see via their memberships or primary.
      const memberships = await prisma.membership.findMany({
        where: { userId: auth.id },
        select: { tenantId: true },
      });
      const tenantIds = new Set<string>();
      if (auth.primaryTenantId) tenantIds.add(auth.primaryTenantId);
      for (const m of memberships) if (m.tenantId) tenantIds.add(m.tenantId);

      const where: Record<string, unknown> = {
        OR: [{ name: search }, { slug: search }],
      };
      // SuperAdmin sees all; others only see their set.
      if (!auth.isSuperAdmin && tenantIds.size > 0) {
        where.AND = [{ id: { in: Array.from(tenantIds) } }];
      } else if (!auth.isSuperAdmin) {
        return NextResponse.json({ ok: true, candidates: [] });
      }

      const rows = await prisma.tenant.findMany({
        where,
        take: 20,
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      });
      return NextResponse.json({
        ok: true,
        candidates: rows.map((t) => ({
          id: t.id,
          label: t.name,
          hint: t.slug,
        })),
      });
    }

    if (kind === "community") {
      // Workspaces the caller is in OR that belong to a tenant they reach.
      const myCommunities = await prisma.rowiCommunityUser.findMany({
        where: { userId: auth.id },
        select: { communityId: true },
      });
      const myCommunityIds = myCommunities.map((c) => c.communityId);

      const rows = await prisma.rowiCommunity.findMany({
        where: {
          OR: [{ name: search }, { slug: search }],
          AND: auth.isSuperAdmin
            ? []
            : [
                {
                  OR: [
                    { id: { in: myCommunityIds } },
                    { tenantId: auth.primaryTenantId || undefined },
                  ],
                },
              ],
        },
        take: 20,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          workspaceType: true,
        },
      });
      return NextResponse.json({
        ok: true,
        candidates: rows.map((c) => ({
          id: c.id,
          label: c.name,
          hint: c.workspaceType || c.slug,
        })),
      });
    }

    if (kind === "organization") {
      const myOrgs = await prisma.orgMembership.findMany({
        where: { userId: auth.id },
        select: { organizationId: true },
      });
      const orgIds = myOrgs.map((o) => o.organizationId);

      const rows = await prisma.organization.findMany({
        where: {
          OR: [{ name: search }, { slug: search }],
          AND: auth.isSuperAdmin ? [] : [{ id: { in: orgIds } }],
        },
        take: 20,
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      });
      return NextResponse.json({
        ok: true,
        candidates: rows.map((o) => ({
          id: o.id,
          label: o.name,
          hint: o.slug,
        })),
      });
    }

    return NextResponse.json(
      { ok: false, error: "kind inválido (user|tenant|community|organization)" },
      { status: 400 },
    );
  } catch (err: any) {
    console.error("❌ Error /api/account/services/lookup:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Error interno" },
      { status: 500 },
    );
  }
}
