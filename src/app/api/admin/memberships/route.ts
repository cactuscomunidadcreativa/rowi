import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { TenantRole } from "@prisma/client";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { tenantIdsForScope } from "@/core/admin/scopedList";

export const runtime = "nodejs";

/* =========================================================
   🧩 GET — Listar membresías (scope-aware: tenant admins ven sólo sus tenants)
========================================================= */
export async function GET() {
  try {
    const auth = await requireAdminWithScope();
    if (auth.error) return auth.error;

    const allowed = await tenantIdsForScope(auth.scope);
    const where =
      allowed === null
        ? undefined
        : { tenantId: { in: allowed } };

    const memberships = await prisma.membership.findMany({
      ...(where ? { where } : {}),
      include: {
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true, slug: true } },
        plan: { select: { id: true, name: true, priceUsd: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, total: memberships.length, memberships });
  } catch (error: any) {
    console.error("❌ Error GET /api/admin/memberships:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al listar membresías" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Crear una nueva membresía
========================================================= */
export async function POST(req: Request) {
  try {
    const auth = await requireAdminWithScope();
    if (auth.error) return auth.error;

    const data = await req.json();

    if (!data.userId || !data.tenantId) {
      return NextResponse.json(
        { ok: false, error: "userId y tenantId son requeridos" },
        { status: 400 }
      );
    }

    const allowed = await tenantIdsForScope(auth.scope);
    if (allowed !== null && !allowed.includes(data.tenantId)) {
      return NextResponse.json(
        { ok: false, error: "tenantId fuera de tu scope de admin" },
        { status: 403 }
      );
    }

    const membership = await prisma.membership.create({
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        planId: data.planId || null,
        role:
          data.role && Object.values(TenantRole).includes(data.role)
            ? data.role
            : TenantRole.VIEWER,
        tokenQuota: data.tokenQuota ?? 0,
        tokenUsed: data.tokenUsed ?? 0,
        notes: data.notes || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true, slug: true } },
        plan: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ ok: true, membership });
  } catch (error: any) {
    console.error("❌ Error detallado POST /memberships:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al crear membresía" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✏️ PUT — Editar una membresía existente
========================================================= */
export async function PUT(req: Request) {
  try {
    const auth = await requireAdminWithScope();
    if (auth.error) return auth.error;

    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Falta el ID de la membresía" },
        { status: 400 }
      );
    }

    const allowed = await tenantIdsForScope(auth.scope);
    if (allowed !== null) {
      const existing = await prisma.membership.findUnique({
        where: { id },
        select: { tenantId: true },
      });
      if (!existing || !allowed.includes(existing.tenantId)) {
        return NextResponse.json(
          { ok: false, error: "Membership fuera de tu scope" },
          { status: 403 }
        );
      }
    }

    const membership = await prisma.membership.update({
      where: { id },
      data: {
        planId: data.planId || null,
        role:
          data.role && Object.values(TenantRole).includes(data.role)
            ? data.role
            : undefined,
        tokenQuota: data.tokenQuota ?? undefined,
        tokenUsed: data.tokenUsed ?? undefined,
        notes: data.notes ?? undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true, slug: true } },
        plan: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ ok: true, membership });
  } catch (error: any) {
    console.error("❌ Error detallado PUT /memberships:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al actualizar membresía" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE — Eliminar una membresía
========================================================= */
export async function DELETE(req: Request) {
  try {
    const auth = await requireAdminWithScope();
    if (auth.error) return auth.error;

    const { id } = await req.json();

    if (!id)
      return NextResponse.json(
        { ok: false, error: "Falta el ID de la membresía" },
        { status: 400 }
      );

    const allowed = await tenantIdsForScope(auth.scope);
    if (allowed !== null) {
      const existing = await prisma.membership.findUnique({
        where: { id },
        select: { tenantId: true },
      });
      if (!existing || !allowed.includes(existing.tenantId)) {
        return NextResponse.json(
          { ok: false, error: "Membership fuera de tu scope" },
          { status: 403 }
        );
      }
    }

    await prisma.membership.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: "Membresía eliminada" });
  } catch (error: any) {
    console.error("❌ Error detallado DELETE /memberships:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al eliminar membresía" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";