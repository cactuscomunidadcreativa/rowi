/**
 * GET /api/account/employee-profile
 *   Retorna el EmployeeProfile del user actual en su primaryTenant (si existe).
 *
 * PATCH /api/account/employee-profile
 *   Body: { managerId?: string | null, position?: string, department?: string }
 *
 *   Self-service del onboarding — el empleado declara su manager (#28).
 *   - Resuelve o crea EmployeeProfile para el user actual en su primaryTenant.
 *   - managerId apunta a OTRO EmployeeProfile.id, no a un User.id.
 *   - Valida que el candidato pertenece al mismo tenant.
 *   - Cycle detection (helper compartido con admin/hr/employees).
 *   - Logs INVITE/ACCOUNT events en ActivityLog (auditoría ligera). No
 *     dispara email al manager declarado para mantener el cambio acotado;
 *     el manager verá al nuevo report cuando entre a /hub/team.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";
import { wouldCreateCycle } from "@/lib/hr/manager-cycle";
import { telemetry } from "@/lib/telemetry";

export const runtime = "nodejs";

const EMPLOYEE_SELECT = {
  id: true,
  userId: true,
  tenantId: true,
  position: true,
  department: true,
  managerId: true,
  status: true,
  manager: {
    select: {
      id: true,
      position: true,
      user: { select: { id: true, name: true, email: true } },
    },
  },
} as const;

export async function GET() {
  const auth = await getServerAuthUser();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { primaryTenantId: true },
  });

  if (!user?.primaryTenantId) {
    return NextResponse.json({ ok: true, profile: null, tenantId: null });
  }

  const profile = await prisma.employeeProfile.findFirst({
    where: { userId: auth.id, tenantId: user.primaryTenantId },
    select: EMPLOYEE_SELECT,
  });

  return NextResponse.json({ ok: true, profile, tenantId: user.primaryTenantId });
}

export async function PATCH(req: NextRequest) {
  const auth = await getServerAuthUser();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
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

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { primaryTenantId: true },
  });

  // B2C — no tenant, no EmployeeProfile semantics. Devolvemos un error
  // claro para que el UI muestre el skip del step.
  if (!user?.primaryTenantId) {
    return NextResponse.json(
      { ok: false, error: "no_primary_tenant" },
      { status: 400 },
    );
  }

  const tenantId = user.primaryTenantId;

  // Resolver o crear EmployeeProfile del user en su primaryTenant.
  let profile = await prisma.employeeProfile.findFirst({
    where: { userId: auth.id, tenantId },
    select: { id: true, managerId: true, tenantId: true },
  });
  if (!profile) {
    const created = await prisma.employeeProfile.create({
      data: {
        userId: auth.id,
        tenantId,
        status: "ACTIVE",
      },
      select: { id: true, managerId: true, tenantId: true },
    });
    profile = created;
  }

  const data: Record<string, unknown> = {};

  if (body.managerId !== undefined) {
    if (body.managerId === null) {
      data.managerId = null;
    } else if (typeof body.managerId === "string" && body.managerId.length > 0) {
      const candidate = await prisma.employeeProfile.findUnique({
        where: { id: body.managerId },
        select: { id: true, tenantId: true, userId: true },
      });
      if (!candidate) {
        return NextResponse.json(
          { ok: false, error: "manager_not_found" },
          { status: 400 },
        );
      }
      if (candidate.tenantId !== tenantId) {
        return NextResponse.json(
          { ok: false, error: "manager_tenant_mismatch" },
          { status: 400 },
        );
      }
      if (candidate.userId === auth.id) {
        return NextResponse.json(
          { ok: false, error: "manager_is_self" },
          { status: 400 },
        );
      }
      if (await wouldCreateCycle(profile.id, body.managerId)) {
        return NextResponse.json(
          { ok: false, error: "manager_cycle" },
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

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { ok: false, error: "Nada que actualizar" },
      { status: 400 },
    );
  }

  const updated = await prisma.employeeProfile.update({
    where: { id: profile.id },
    data: data as any,
    select: EMPLOYEE_SELECT,
  });

  // Audit log — el empleado declaró un manager. No bloqueamos si falla.
  if (data.managerId !== undefined) {
    try {
      await prisma.activityLog.create({
        data: {
          userId: auth.id,
          action: "MANAGER_DECLARED",
          entity: "EmployeeProfile",
          targetId: profile.id,
          details: {
            managerId: data.managerId,
            tenantId,
            source: "self_onboarding",
          },
        },
      });
    } catch (logErr) {
      telemetry.captureException(logErr, { route: "/api/account/employee-profile", op: "activity_log", fatal: false });
    }
  }

  return NextResponse.json({ ok: true, profile: updated });
}
