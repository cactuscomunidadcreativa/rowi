// src/app/api/admin/hr/org-chart/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { tenantIdsForScope } from "@/core/admin/scopedList";

export const runtime = "nodejs";

/**
 * GET /api/admin/hr/org-chart
 *
 * Returns the entire manager → direct-reports tree for the admin's
 * accessible tenants. Shape:
 *
 *   { roots: EmployeeNode[], orphans: EmployeeNode[], total: number }
 *
 * where:
 *   - roots:   employees who don't report to anyone (manager == null)
 *              within scope. Each carries its children recursively.
 *   - orphans: employees whose manager is OUTSIDE the admin's tenant
 *              set (rare but possible if scope was narrowed). Surfaces
 *              them so they don't disappear.
 *
 * The tree is built in-memory from a single flat query — fine up to
 * a few thousand employees per tenant. Past that, swap for a recursive
 * CTE.
 */

type EmployeeNode = {
  id: string;
  position: string | null;
  department: string | null;
  status: string;
  user: { id: string; name: string | null; email: string | null; image: string | null } | null;
  tenant: { id: string; name: string } | null;
  managerId: string | null;
  children: EmployeeNode[];
};

export async function GET() {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  const allowed = await tenantIdsForScope(auth.scope);
  const where = allowed === null ? {} : { tenantId: { in: allowed } };

  const employees = await prisma.employeeProfile.findMany({
    where,
    select: {
      id: true,
      position: true,
      department: true,
      status: true,
      managerId: true,
      user: { select: { id: true, name: true, email: true, image: true } },
      tenant: { select: { id: true, name: true } },
    },
    orderBy: [{ tenant: { name: "asc" } }, { position: "asc" }],
  });

  // Build a lookup table and attach children to their managers.
  const nodes = new Map<string, EmployeeNode>();
  for (const e of employees) {
    nodes.set(e.id, { ...e, children: [] });
  }

  const roots: EmployeeNode[] = [];
  const orphans: EmployeeNode[] = [];

  for (const node of nodes.values()) {
    if (!node.managerId) {
      roots.push(node);
      continue;
    }
    const parent = nodes.get(node.managerId);
    if (parent) {
      parent.children.push(node);
    } else {
      // Manager exists in DB but is out of the admin's scope.
      orphans.push(node);
    }
  }

  return NextResponse.json({
    ok: true,
    roots,
    orphans,
    total: employees.length,
  });
}
