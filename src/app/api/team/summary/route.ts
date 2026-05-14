// src/app/api/team/summary/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";
import {
  ACTIVE_CONTEXT_COOKIE,
  resolveContextTenantId,
} from "@/lib/account/contexts";

export const runtime = "nodejs";

/**
 * GET /api/team/summary
 *
 * Returns the caller's manager dashboard view. A user can be a manager
 * in multiple tenants (e.g. consulting at two orgs); we group reports
 * by the employee profile they roll up to.
 *
 * Shape:
 * {
 *   profiles: [{
 *     id, position, department, tenant, reports: [
 *       { id, position, department, status, user: { name, email, image } }
 *     ]
 *   }]
 * }
 */
export async function GET() {
  const auth = await getServerAuthUser();
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "No autenticado" },
      { status: 401 },
    );
  }

  // Active context filter: if the cookie points to a tenant the user is
  // an employee of, narrow the profile set to just that tenant. Same
  // safety contract as /api/org/summary — narrowing only, never granting.
  const cookieStore = await cookies();
  const activeContextCookie = cookieStore.get(ACTIVE_CONTEXT_COOKIE)?.value;
  const resolvedContextTenantId = activeContextCookie
    ? await resolveContextTenantId(activeContextCookie)
    : null;

  const baseProfileWhere = { userId: auth.id, status: "ACTIVE" as const };
  const profileWhere = resolvedContextTenantId
    ? { ...baseProfileWhere, tenantId: resolvedContextTenantId }
    : baseProfileWhere;

  const profiles = await prisma.employeeProfile.findMany({
    where: profileWhere,
    select: {
      id: true,
      position: true,
      department: true,
      tenant: { select: { id: true, name: true, slug: true } },
      reports: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          position: true,
          department: true,
          status: true,
          hireDate: true,
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
    },
  });

  const totalReports = profiles.reduce((sum, p) => sum + p.reports.length, 0);
  const profilesWithReports = profiles.filter((p) => p.reports.length > 0);

  // If a context filter applied but found no profiles in that tenant,
  // the response is the same shape — empty arrays — and the UI handles
  // it the same as "not an employee anywhere yet".
  const activeContextFilter = resolvedContextTenantId
    ? { tenantId: resolvedContextTenantId }
    : null;

  return NextResponse.json({
    ok: true,
    totalReports,
    profilesWithReports,
    allProfiles: profiles, // for context: even profiles where I have no reports yet
    activeContextFilter,
  });
}
