/**
 * API: Admin Invites Management
 * GET /api/admin/invites - Listar todas las invitaciones
 * DELETE /api/admin/invites - Eliminar invitación
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const dynamic = "force-dynamic";

// =========================================================
// GET — Listar todas las Invitaciones
// =========================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};

    if (status && status !== "all") {
      // Map status to date comparison
      const now = new Date();
      if (status === "pending") {
        where.expiresAt = { gt: now };
      } else if (status === "expired") {
        where.expiresAt = { lte: now };
      }
    }

    const invites = await prisma.inviteToken.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 500,
    });

    // Calculate stats
    const now = new Date();
    const stats = {
      total: invites.length,
      pending: invites.filter((i) => new Date(i.expiresAt) > now).length,
      accepted: 0, // Would need to track this separately
      expired: invites.filter((i) => new Date(i.expiresAt) <= now).length,
    };

    // Transform to expected format
    const transformedInvites = invites.map((inv) => ({
      id: inv.id,
      token: inv.token,
      email: inv.email,
      contact: inv.email,
      channel: "email" as const,
      status: new Date(inv.expiresAt) > now ? "pending" : "expired",
      createdAt: inv.createdAt.toISOString(),
      expiresAt: inv.expiresAt.toISOString(),
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.rowiia.com"}/invite/${inv.token}`,
      community: inv.tenant
        ? {
            id: inv.tenant.id,
            name: inv.tenant.name,
          }
        : undefined,
      invitedBy: inv.user
        ? {
            id: inv.user.id,
            name: inv.user.name,
            email: inv.user.email,
          }
        : undefined,
    }));

    return NextResponse.json({
      ok: true,
      total: transformedInvites.length,
      stats,
      invites: transformedInvites,
    });
  } catch (err: any) {
    console.error("Error GET /api/admin/invites:", err);
    return NextResponse.json(
      { ok: false, error: "Error cargando invitaciones" },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE — Eliminar una Invitación
// =========================================================
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Falta el ID de la invitación" },
        { status: 400 }
      );
    }

    await prisma.inviteToken.delete({ where: { id } });

    return NextResponse.json({
      ok: true,
      message: "Invitación eliminada correctamente",
    });
  } catch (err: any) {
    console.error("Error DELETE /api/admin/invites:", err);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar la invitación" },
      { status: 500 }
    );
  }
}
