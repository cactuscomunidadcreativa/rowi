// src/app/api/admin/user-roles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

async function requireSuperAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) return { error: "Unauthorized", status: 401 };
  const user = await prisma.user.findUnique({
    where: { id: token.sub },
    select: { id: true, organizationRole: true },
  });
  if (!user || (user.organizationRole !== "SUPERADMIN" && user.organizationRole !== "ADMIN")) {
    return { error: "Forbidden", status: 403 };
  }
  return { user };
}

/**
 * GET /api/admin/user-roles?search=edu
 * Lista usuarios con sus roles agregados.
 */
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        }
      : {},
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
 * Asigna rol global.
 * Body: { userId, organizationRole }
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { userId, organizationRole } = body;
  if (!userId || !organizationRole) {
    return NextResponse.json({ error: "userId and organizationRole required" }, { status: 400 });
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
 * Grant super access (like the script) via UI.
 * Body: { email }
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

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
