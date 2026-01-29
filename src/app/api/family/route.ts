/**
 * 👨‍👩‍👧‍👦 API: Plan Familiar
 * GET /api/family - Obtener info del plan familiar y miembros
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();

    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Obtener usuario con su plan y tenant
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        plan: true,
        primaryTenant: {
          include: {
            memberships: {
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
            },
          },
        },
        usage: true,
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

    // Obtener miembros del tenant (familia)
    const tenant = user.primaryTenant;
    const memberships = tenant?.memberships || [];

    // Transformar a formato de respuesta
    const members = memberships.map((m) => ({
      id: m.user.id,
      name: m.user.name || "",
      email: m.user.email || "",
      role: m.userId === user.id ? "owner" : m.role?.toLowerCase() || "member",
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

    // Agregar invitados pendientes
    for (const invite of pendingInvites) {
      // Verificar que no esté ya en members
      if (!members.find((m) => m.email === invite.email)) {
        members.push({
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
    const tokensUsed = user.usage?.tokensUsed || 0;

    const planInfo = {
      planName: plan.name,
      maxMembers: plan.maxUsers || 6,
      currentMembers: members.length,
      tokensMonthly,
      tokensUsed,
      tokensRemaining: Math.max(0, tokensMonthly - tokensUsed),
      isOwner: true, // El que consulta siempre es el dueño si tiene el plan
      canInvite: members.length < (plan.maxUsers || 6),
    };

    return NextResponse.json({
      ok: true,
      planInfo,
      members,
    });
  } catch (err: any) {
    console.error("❌ Error GET /api/family:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error obteniendo datos" },
      { status: 500 }
    );
  }
}
