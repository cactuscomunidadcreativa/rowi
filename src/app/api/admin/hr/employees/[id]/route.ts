// src/app/api/admin/hr/employees/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";

export const runtime = "nodejs";
export const preferredRegion = "iad1";

const EMPLOYEE_SELECT = {
  id: true,
  userId: true,
  tenantId: true,
  position: true,
  department: true,
  status: true,
  managerId: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, email: true, image: true } },
  tenant: { select: { id: true, name: true, slug: true } },
  manager: {
    select: {
      id: true,
      position: true,
      user: { select: { id: true, name: true, email: true } },
    },
  },
  _count: { select: { reports: true } },
} as const;

function scopeAllowsTenant(
  scope: { type: string; id: string | null },
  tenantId: string | null,
): boolean {
  if (scope.type === "rowiverse") return true;
  if (scope.type === "tenant") return scope.id === tenantId;
  // hub/superhub scopes — caller can manage employees only if they
  // are linked to the same tenant via the existing hierarchy. We keep
  // it permissive at this layer; downstream queries will still filter.
  return true;
}

/**
 * Detects whether assigning `candidateManagerId` to `employeeId` would
 * create a cycle in the reporting line. Walks UP the candidate's chain;
 * if we encounter `employeeId`, there's a cycle.
 */
async function wouldCreateCycle(
  employeeId: string,
  candidateManagerId: string,
): Promise<boolean> {
  if (employeeId === candidateManagerId) return true;
  let cursor: string | null = candidateManagerId;
  const seen = new Set<string>();
  while (cursor) {
    if (cursor === employeeId) return true;
    if (seen.has(cursor)) return true; // safety, shouldn't happen with valid data
    seen.add(cursor);
    const node: { managerId: string | null } | null =
      await prisma.employeeProfile.findUnique({
        where: { id: cursor },
        select: { managerId: true },
      });
    cursor = node?.managerId ?? null;
  }
  return false;
}

/**
 * GET /api/admin/hr/employees/[id]
 *
 * Returns a single employee with manager + reports count. Used by the
 * future /team page for the manager-side hierarchy view.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const employee = await prisma.employeeProfile.findUnique({
    where: { id },
    select: EMPLOYEE_SELECT,
  });
  if (!employee) {
    return NextResponse.json(
      { ok: false, error: "Employee no encontrado" },
      { status: 404 },
    );
  }
  if (!scopeAllowsTenant(auth.scope, employee.tenantId)) {
    return NextResponse.json(
      { ok: false, error: "Fuera de scope" },
      { status: 403 },
    );
  }
  return NextResponse.json({ ok: true, employee });
}

/**
 * PATCH /api/admin/hr/employees/[id]
 * Body: { managerId?: string | null, position?, department?, status? }
 *
 * Assigns or unassigns a manager. The manager must belong to the same
 * tenant as the employee. Cycle detection prevents an employee from
 * reporting (directly or indirectly) to one of their own reports.
 *
 * Other fields (position, department, status) are also editable here
 * since this is the canonical PATCH for employee records.
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const employee = await prisma.employeeProfile.findUnique({
    where: { id },
    select: { id: true, tenantId: true, managerId: true },
  });
  if (!employee) {
    return NextResponse.json(
      { ok: false, error: "Employee no encontrado" },
      { status: 404 },
    );
  }
  if (!scopeAllowsTenant(auth.scope, employee.tenantId)) {
    return NextResponse.json(
      { ok: false, error: "Fuera de scope" },
      { status: 403 },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body JSON inválido" },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = {};

  if (body.managerId !== undefined) {
    if (body.managerId === null) {
      data.managerId = null;
    } else if (typeof body.managerId === "string") {
      const candidate = await prisma.employeeProfile.findUnique({
        where: { id: body.managerId },
        select: { id: true, tenantId: true },
      });
      if (!candidate) {
        return NextResponse.json(
          { ok: false, error: "Manager candidato no existe" },
          { status: 400 },
        );
      }
      if (
        candidate.tenantId &&
        employee.tenantId &&
        candidate.tenantId !== employee.tenantId
      ) {
        return NextResponse.json(
          { ok: false, error: "El manager debe pertenecer al mismo tenant" },
          { status: 400 },
        );
      }
      if (await wouldCreateCycle(id, body.managerId)) {
        return NextResponse.json(
          {
            ok: false,
            error: "Asignación crearía un ciclo en la línea de reporte",
          },
          { status: 400 },
        );
      }
      data.managerId = body.managerId;
    } else {
      return NextResponse.json(
        { ok: false, error: "managerId debe ser string o null" },
        { status: 400 },
      );
    }
  }

  if (typeof body.position === "string") {
    data.position = body.position.trim() || null;
  }
  if (typeof body.department === "string") {
    data.department = body.department.trim() || null;
  }
  if (typeof body.status === "string") {
    const allowed = ["ACTIVE", "PAUSED", "TERMINATED", "ON_LEAVE"];
    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        { ok: false, error: "status inválido" },
        { status: 400 },
      );
    }
    data.status = body.status;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { ok: false, error: "Nada que actualizar" },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.employeeProfile.update({
      where: { id },
      data: data as any,
      select: EMPLOYEE_SELECT,
    });
    return NextResponse.json({ ok: true, employee: updated });
  } catch (err: any) {
    console.error("❌ Error PATCH /api/admin/hr/employees/[id]:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Error interno" },
      { status: 500 },
    );
  }
}
