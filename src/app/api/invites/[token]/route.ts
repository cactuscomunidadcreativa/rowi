// src/app/api/invites/[token]/route.ts
/**
 * API para verificar y aceptar invitaciones por token
 * GET - Verificar si un token de invitación es válido
 * PUT - Marcar invitación como aceptada (después del registro)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/config";

export const dynamic = "force-dynamic";

// GET - Verificar token de invitación
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ ok: false, error: "Token requerido" }, { status: 400 });
  }

  try {
    const invite = await prisma.inviteToken.findUnique({
      where: { token },
      include: {
        user: {
          select: { name: true, email: true },
        },
        tenant: {
          select: { name: true },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { ok: false, error: "Invitación no encontrada", valid: false },
        { status: 404 }
      );
    }

    // Verificar si ya expiró
    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { ok: false, error: "Invitación expirada", valid: false, expired: true },
        { status: 410 }
      );
    }

    // Verificar si ya fue aceptada (usuario con ese email existe)
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    });

    return NextResponse.json({
      ok: true,
      valid: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt.toISOString(),
        invitedBy: invite.user?.name || invite.user?.email || "Alguien",
        tenantName: invite.tenant?.name || null,
        alreadyAccepted: !!existingUser,
      },
    });
  } catch (err: any) {
    console.error("❌ Error GET /api/invites/[token]:", err);
    return NextResponse.json(
      { ok: false, error: "Error verificando invitación" },
      { status: 500 }
    );
  }
}

// PUT - Marcar invitación como aceptada
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!token) {
    return NextResponse.json({ ok: false, error: "Token requerido" }, { status: 400 });
  }

  try {
    const invite = await prisma.inviteToken.findUnique({
      where: { token },
    });

    if (!invite) {
      return NextResponse.json(
        { ok: false, error: "Invitación no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si expiró
    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { ok: false, error: "Invitación expirada" },
        { status: 410 }
      );
    }

    // Vincular al usuario con el tenant si existe
    if (invite.tenantId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (user) {
        // Crear membership al tenant
        await prisma.membership.upsert({
          where: {
            userId_tenantId: {
              userId: user.id,
              tenantId: invite.tenantId,
            },
          },
          update: {},
          create: {
            userId: user.id,
            tenantId: invite.tenantId,
            role: (invite.role as any) || "VIEWER",
          },
        });

        // Si no tiene primaryTenant, asignarlo
        if (!user.primaryTenantId) {
          await prisma.user.update({
            where: { id: user.id },
            data: { primaryTenantId: invite.tenantId },
          });
        }
      }
    }

    // Registrar aceptación en ActivityLog
    try {
      await prisma.activityLog.create({
        data: {
          userId: invite.userId,
          action: "INVITE_ACCEPTED",
          entity: "InviteToken",
          targetId: invite.id,
          details: {
            acceptedBy: session.user.email,
            acceptedAt: new Date().toISOString(),
          },
        },
      });
    } catch (logErr) {
      console.warn("⚠️ Error logging invite acceptance:", logErr);
    }

    return NextResponse.json({
      ok: true,
      message: "Invitación aceptada",
      invite: {
        id: invite.id,
        email: invite.email,
        tenantId: invite.tenantId,
      },
    });
  } catch (err: any) {
    console.error("❌ Error PUT /api/invites/[token]:", err);
    return NextResponse.json(
      { ok: false, error: "Error aceptando invitación" },
      { status: 500 }
    );
  }
}
