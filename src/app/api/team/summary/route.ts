// src/app/api/team/summary/route.ts
import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";

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

  const profiles = await prisma.employeeProfile.findMany({
    where: { userId: auth.id, status: "ACTIVE" },
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

  return NextResponse.json({
    ok: true,
    totalReports,
    profilesWithReports,
    allProfiles: profiles, // for context: even profiles where I have no reports yet
  });
}
