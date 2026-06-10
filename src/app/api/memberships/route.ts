import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import {
  requireAdminWithScope,
  requireSuperAdmin,
} from "@/core/auth/requireAdmin";
import { tenantIdsForScope } from "@/core/admin/scopedList";
import { TenantRole } from "@prisma/client";

/**
 * Memberships CRUD.
 *
 * 🔐 SEGURIDAD: las membresías otorgan acceso a un tenant y fijan rol +
 * cuota de tokens, por lo que son cross-tenant por naturaleza. Patrón del
 * repo: **leer scope-aware, mutar SuperAdmin**. Las mutaciones se restringen
 * a SuperAdmin; los tenant/hub-admins solo ven (y crearán) dentro de su scope.
 */

// Debe coincidir con el enum Prisma `TenantRole`.
const ALLOWED_ROLES = new Set<string>(Object.values(TenantRole));

function asTenantRole(value: unknown): TenantRole {
  const upper = String(value).toUpperCase();
  return upper as TenantRole;
}

export async function GET() {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  try {
    // rowiverse (SuperAdmin) → null = sin filtro. Resto → narrow a su scope.
    const allowedTenantIds = await tenantIdsForScope(auth.scope);

    const memberships = await prisma.membership.findMany({
      where: allowedTenantIds === null ? undefined : { tenantId: { in: allowedTenantIds } },
      take: 1000, // E4: tope duro — el admin pagina/busca, no necesita el universo
      include: {
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true, slug: true } },
        plan: { select: { id: true, name: true, priceUsd: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(memberships);
  } catch (error) {
    console.error("Error GET memberships:", error);
    return NextResponse.json({ error: "Error al listar" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const data = await req.json();

    if (!data?.userId || !data?.tenantId) {
      return NextResponse.json(
        { error: "userId y tenantId son requeridos" },
        { status: 400 }
      );
    }
    const role = (data.role || "VIEWER").toUpperCase();
    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    const membership = await prisma.membership.create({
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        planId: data.planId || null,
        role: asTenantRole(role),
        tokenQuota: Number.isFinite(data.tokenQuota) ? data.tokenQuota : 0,
        tokenUsed: Number.isFinite(data.tokenUsed) ? data.tokenUsed : 0,
      },
      include: { user: true, tenant: true, plan: true },
    });
    return NextResponse.json(membership);
  } catch (error) {
    console.error("Error POST memberships:", error);
    return NextResponse.json({ error: "Error al crear" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const { id, ...data } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id requerido" }, { status: 400 });
    }
    if (data.role !== undefined && !ALLOWED_ROLES.has(String(data.role).toUpperCase())) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    const updateData: {
      role?: TenantRole;
      planId?: string | null;
      tokenQuota?: number;
      tokenUsed?: number;
    } = {};
    if (data.role !== undefined) updateData.role = asTenantRole(data.role);
    if (data.planId !== undefined) updateData.planId = data.planId || null;
    if (data.tokenQuota !== undefined) updateData.tokenQuota = data.tokenQuota;
    if (data.tokenUsed !== undefined) updateData.tokenUsed = data.tokenUsed;

    const membership = await prisma.membership.update({
      where: { id },
      data: updateData,
      include: { user: true, tenant: true, plan: true },
    });
    return NextResponse.json(membership);
  } catch (error) {
    console.error("Error PUT memberships:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id requerido" }, { status: 400 });
    }
    await prisma.membership.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error DELETE memberships:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
