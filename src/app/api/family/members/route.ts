/**
 * 👨‍👩‍👧‍👦 API: Gestionar miembros familiares
 * DELETE /api/family/members - Remover un miembro de la familia
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

// DELETE - Remover miembro de la familia
export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userEmail = token?.email?.toLowerCase();

    if (!userEmail) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        plan: true,
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Verificar que tiene plan familiar
    const plan = user.plan;
    if (!plan || (plan.planType !== "family" && !plan.allowFamilyMembers)) {
      return NextResponse.json(
        { ok: false, error: "No tienes un plan familiar activo" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const memberId = body.memberId as string;

    if (!memberId) {
      return NextResponse.json(
        { ok: false, error: "memberId es requerido" },
        { status: 400 }
      );
    }

    // No puede removerse a sí mismo
    if (memberId === user.id) {
      return NextResponse.json(
        { ok: false, error: "No puedes removerte a ti mismo" },
        { status: 400 }
      );
    }

    // Verificar si es un InviteToken pendiente (para cancelar invitación)
    const invite = await prisma.inviteToken.findFirst({
      where: {
        id: memberId,
        userId: user.id,
      },
    });

    if (invite) {
      // Es una invitación pendiente, cancelarla
      await prisma.inviteToken.delete({ where: { id: memberId } });

      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "FAMILY_INVITE_CANCELLED",
          entity: "InviteToken",
          targetId: memberId,
          details: { email: invite.email },
        },
      }).catch(() => {});

      return NextResponse.json({
        ok: true,
        message: "Invitación cancelada",
        removed: { id: memberId, type: "invite" },
      });
    }

    // Verificar si es un miembro real
    if (!user.primaryTenantId) {
      return NextResponse.json(
        { ok: false, error: "No tienes un grupo familiar configurado" },
        { status: 400 }
      );
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: memberId,
        tenantId: user.primaryTenantId,
      },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { ok: false, error: "Miembro no encontrado en tu familia" },
        { status: 404 }
      );
    }

    // Remover membership
    await prisma.membership.delete({
      where: { id: membership.id },
    });

    // También remover el primaryTenantId del usuario removido
    await prisma.user.update({
      where: { id: memberId },
      data: { primaryTenantId: null },
    });

    // Log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "FAMILY_MEMBER_REMOVED",
        entity: "Membership",
        targetId: membership.id,
        details: {
          removedUserId: memberId,
          removedEmail: membership.user.email,
        },
      },
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      message: "Miembro removido de la familia",
      removed: {
        id: memberId,
        email: membership.user.email,
        type: "member",
      },
    });
  } catch (err: any) {
    console.error("❌ Error DELETE /api/family/members:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error removiendo miembro" },
      { status: 500 }
    );
  }
}
