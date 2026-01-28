import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   🧠 GET — Detalle completo de un usuario
========================================================= */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } } // ✅ SIN Promise
) {
  const { id } = params;

  try {
    const auth = await getServerAuthUser().catch(() => null);

    const actor = auth
      ? await prisma.user.findUnique({
          where: { id: auth.id },
          select: { organizationRole: true, primaryTenantId: true },
        })
      : null;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        plan: { select: { id: true, name: true, priceUsd: true } },
        primaryTenant: { select: { id: true, name: true, slug: true } },
        memberships: {
          include: {
            tenant: { select: { id: true, name: true } },
            plan: { select: { id: true, name: true } },
          },
        },
        orgMemberships: {
          include: {
            organization: { select: { id: true, name: true } },
          },
        },
        hubMemberships: {
          include: {
            hub: { select: { id: true, name: true, slug: true } },
          },
        },
        aiControls: {
          select: { id: true, feature: true, enabled: true, updatedAt: true },
        },
      },
    });

    if (!user)
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado" },
        { status: 404 }
      );

    // 🔒 Validación mínima
    if (
      actor?.organizationRole === "ADMIN" &&
      user.primaryTenantId !== actor.primaryTenantId
    ) {
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true, user });
  } catch (err: any) {
    console.error("❌ Error GET /api/admin/users/[id]/full:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error interno" },
      { status: 500 }
    );
  }
}