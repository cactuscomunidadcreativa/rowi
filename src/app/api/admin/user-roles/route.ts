// src/app/api/admin/user-roles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope, requireSuperAdmin } from "@/core/auth/requireAdmin";
import { scopeCanSeeUser, tenantIdsForScope } from "@/core/admin/scopedList";

export const runtime = "nodejs";

/**
 * GET /api/admin/user-roles?search=edu
 *
 * Lists users with their roles aggregated. Scope-aware: tenant/hub/
 * superhub admins see only users with at least one membership in
 * their tenant set; rowiverse admins see everyone.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  const allowed = await tenantIdsForScope(auth.scope);
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  const baseWhere: Record<string, unknown> = {};
  if (allowed !== null) {
    // Only users with at least one membership (direct or via communities)
    // in the admin's tenant set. Keep OR loose to catch all the membership
    // shapes the codebase uses.
    baseWhere.OR = [
      { memberships: { some: { tenantId: { in: allowed } } } },
      { primaryTenantId: { in: allowed } },
      { rowiCommunities: { some: { community: { tenantId: { in: allowed } } } } },
    ];
  }

  const where = search
    ? {
        AND: [
          baseWhere,
          {
            OR: [
              { email: { contains: search, mode: "insensitive" as const } },
              { name: { contains: search, mode: "insensitive" as const } },
            ],
          },
        ],
      }
    : baseWhere;

  const users = await prisma.user.findMany({
    where,
    take: 50,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      organizationRole: true,
      country: true,
      image: true,
      memberships: { select: { tenantId: true, role: true } },
      rowiCommunities: {
        select: {
          communityId: true,
          role: true,
          community: { select: { name: true, workspaceType: true } },
        },
      },
      orgMemberships: { select: { organizationId: true, role: true } },
    },
  });

  return NextResponse.json({ users });
}

/**
 * PATCH /api/admin/user-roles
 *
 * Scope-aware policy on organizationRole flips:
 *   - SUPERADMIN  → SuperAdmin only (granting platform access).
 *   - ADMIN       → any admin who can see the user.
 *   - everything  → any admin who can see the user.
 *     else
 *
 * Tenant admins can now flip ADMIN/VIEWER/etc on their own people
 * without escalating; granting SUPERADMIN still requires SuperAdmin.
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  const body = await req.json();
  const { userId, organizationRole } = body;
  if (!userId || !organizationRole) {
    return NextResponse.json({ error: "userId and organizationRole required" }, { status: 400 });
  }

  // Granting SUPERADMIN is a platform op.
  const targetRole = String(organizationRole).toUpperCase();
  if (targetRole === "SUPERADMIN" && auth.scope.type !== "rowiverse") {
    return NextResponse.json(
      { error: "Solo SuperAdmin puede asignar el rol SUPERADMIN" },
      { status: 403 },
    );
  }

  // Otherwise: must be able to see the target user.
  if (!(await scopeCanSeeUser(auth.scope, userId))) {
    return NextResponse.json(
      { error: "Usuario fuera de tu scope" },
      { status: 403 },
    );
  }

  // Prevent demoting an existing SuperAdmin unless caller is SuperAdmin.
  if (auth.scope.type !== "rowiverse") {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationRole: true },
    });
    if (
      (target?.organizationRole || "").toUpperCase() === "SUPERADMIN"
    ) {
      return NextResponse.json(
        { error: "No puedes modificar a un SuperAdmin" },
        { status: 403 },
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { organizationRole },
    select: { id: true, email: true, organizationRole: true },
  });

  return NextResponse.json({ user: updated });
}

/**
 * POST /api/admin/user-roles
 * Grant super access. SuperAdmin-only — creating new SuperAdmins is
 * a platform operation and bypasses scope.
 * Body: { email }
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const body = await req.json();
  const { email } = body;
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true, email: true, primaryTenantId: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.user.update({
    where: { id: user.id },
    data: { organizationRole: "SUPERADMIN" },
  });

  // Membership SUPERADMIN
  if (user.primaryTenantId) {
    const existing = await prisma.membership.findFirst({
      where: { userId: user.id, tenantId: user.primaryTenantId },
    });
    if (existing) {
      await prisma.membership.update({
        where: { id: existing.id },
        data: { role: "SUPERADMIN" },
      });
    } else {
      await prisma.membership.create({
        data: { userId: user.id, tenantId: user.primaryTenantId, role: "SUPERADMIN" },
      });
    }
  }

  return NextResponse.json({ success: true, userId: user.id });
}
