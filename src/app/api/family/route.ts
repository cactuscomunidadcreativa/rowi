/**
 * 👨‍👩‍👧‍👦 API: Plan Familiar
 * GET /api/family - Obtener info del plan familiar y miembros
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

interface MembershipWithUser {
  userId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: Date;
  };
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();

    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Obtener usuario con su plan
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        plan: true,
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Verificar si tiene plan familiar
    const plan = user.plan;
    const isFamilyPlan = plan?.planType === "family" || plan?.allowFamilyMembers;

    if (!isFamilyPlan || !plan) {
      return NextResponse.json({
        ok: true,
        planInfo: null,
        members: [],
        message: "No tienes un plan familiar activo",
      });
    }

    // Obtener tenant del usuario si existe
    let memberships: MembershipWithUser[] = [];
    if (user.primaryTenantId) {
      const tenantMemberships = await prisma.membership.findMany({
        where: { tenantId: user.primaryTenantId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              createdAt: true,
            },
          },
        },
      });
      memberships = tenantMemberships.map(m => ({
        userId: m.userId,
        role: m.role,
        user: m.user,
      }));
    }

    // Transformar a formato de respuesta
    const members = memberships.map((m) => ({
      id: m.user.id,
      name: m.user.name || "",
      email: m.user.email || "",
      role: m.userId === user.id ? "owner" : (m.role?.toLowerCase() || "member"),
      status: "active" as const,
      joinedAt: m.user.createdAt?.toISOString(),
      avatarUrl: m.user.image || undefined,
    }));

    // Obtener invitaciones pendientes
    const pendingInvites = await prisma.inviteToken.findMany({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
    });

    // Agregar invitados pendientes como lista separada para evitar conflicto de tipos
    const invitedMembers: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      status: "active" | "invited";
      joinedAt: string;
      avatarUrl: string | undefined;
    }> = members.map(m => ({ ...m, status: "active" as const }));

    for (const invite of pendingInvites) {
      // Verificar que no esté ya en members
      if (!invitedMembers.find((m) => m.email === invite.email)) {
        invitedMembers.push({
          id: invite.id,
          name: "",
          email: invite.email,
          role: "member",
          status: "invited" as const,
          joinedAt: invite.createdAt.toISOString(),
          avatarUrl: undefined,
        });
      }
    }

    // Calcular tokens
    const tokensMonthly = plan.tokensMonthly || 500;

    // Obtener uso de tokens del usuario (agregando todos los registros del mes actual)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const userUsageRecords = await prisma.userUsage.findMany({
      where: {
        userId: user.id,
        day: { gte: startOfMonth },
      },
    });
    const tokensUsed = userUsageRecords.reduce((sum, u) => sum + (u.tokensInput || 0) + (u.tokensOutput || 0), 0);

    const planInfo = {
      planName: plan.name,
      maxMembers: plan.maxUsers || 6,
      currentMembers: invitedMembers.length,
      tokensMonthly,
      tokensUsed,
      tokensRemaining: Math.max(0, tokensMonthly - tokensUsed),
      isOwner: true, // El que consulta siempre es el dueño si tiene el plan
      canInvite: invitedMembers.length < (plan.maxUsers || 6),
    };

    return NextResponse.json({
      ok: true,
      planInfo,
      members: invitedMembers,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error obteniendo datos";
    console.error("❌ Error GET /api/family:", err);
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
