/**
 * 👨‍👩‍👧‍👦 API: Invitar miembro familiar
 * POST /api/family/invite - Enviar invitación a un familiar
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userEmail = token?.email?.toLowerCase();

    if (!userEmail) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Obtener usuario con su plan
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        plan: true,
        primaryTenant: {
          include: {
            members: true,
          },
        },
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
    const inviteEmail = (body.email as string)?.toLowerCase().trim();
    const inviteName = (body.name as string)?.trim();

    if (!inviteEmail) {
      return NextResponse.json(
        { ok: false, error: "Email es requerido" },
        { status: 400 }
      );
    }

    // Validar formato de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      return NextResponse.json(
        { ok: false, error: "Email inválido" },
        { status: 400 }
      );
    }

    // No puede invitarse a sí mismo
    if (inviteEmail === userEmail) {
      return NextResponse.json(
        { ok: false, error: "No puedes invitarte a ti mismo" },
        { status: 400 }
      );
    }

    // Contar miembros actuales
    const currentMembers = user.primaryTenant?.members?.length || 1;
    const pendingInvites = await prisma.inviteToken.count({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
    });

    const totalMembers = currentMembers + pendingInvites;
    const maxMembers = plan.maxUsers || 6;

    if (totalMembers >= maxMembers) {
      return NextResponse.json(
        {
          ok: false,
          error: `Has alcanzado el límite de ${maxMembers} miembros familiares`,
          limitReached: true,
        },
        { status: 403 }
      );
    }

    // Verificar si ya está invitado
    const existingInvite = await prisma.inviteToken.findFirst({
      where: {
        userId: user.id,
        email: inviteEmail,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { ok: false, error: "Ya existe una invitación pendiente para este email" },
        { status: 409 }
      );
    }

    // Verificar si ya es miembro
    const existingMember = await prisma.user.findUnique({
      where: { email: inviteEmail },
      include: {
        memberships: {
          where: { tenantId: user.primaryTenantId || undefined },
        },
      },
    });

    if (existingMember && existingMember.memberships.length > 0) {
      return NextResponse.json(
        { ok: false, error: "Esta persona ya es miembro de tu familia" },
        { status: 409 }
      );
    }

    // Crear tenant si no existe
    let tenantId = user.primaryTenantId;
    if (!tenantId) {
      const tenant = await prisma.tenant.create({
        data: {
          name: `Familia de ${user.name || user.email}`,
          slug: `family-${user.id.slice(-8)}`,
        },
      });
      tenantId = tenant.id;

      // Actualizar usuario con el tenant
      await prisma.user.update({
        where: { id: user.id },
        data: { primaryTenantId: tenantId },
      });

      // Crear membership para el owner
      await prisma.membership.create({
        data: {
          userId: user.id,
          tenantId: tenantId,
          role: "ADMIN",
        },
      });
    }

    // Crear invitación
    const inviteToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.inviteToken.create({
      data: {
        userId: user.id,
        tenantId: tenantId,
        email: inviteEmail,
        token: inviteToken,
        role: "VIEWER", // Miembros familiares tienen rol básico
        expiresAt,
      },
    });

    // Generar URL de invitación
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const baseUrl = `${proto}://${host}`;
    const inviteUrl = `${baseUrl}/invite/${inviteToken}`;

    // Mensaje de invitación
    const inviterName = user.name || user.email?.split("@")[0];
    const message = `¡Hola${inviteName ? ` ${inviteName}` : ""}! 👨‍👩‍👧‍👦

${inviterName} te invita a unirte a su Plan Familiar en Rowi.

Podrás acceder a:
• Inteligencia emocional compartida
• 500 tokens de IA mensuales (compartidos)
• Brain Brief y evaluación SEI
• Dashboard familiar

Únete aquí: ${inviteUrl}

Esta invitación expira en 7 días.`;

    // Generar links
    const subject = encodeURIComponent(`${inviterName} te invita al Plan Familiar de Rowi`);
    const bodyEncoded = encodeURIComponent(message);
    const mailtoLink = `mailto:${inviteEmail}?subject=${subject}&body=${bodyEncoded}`;

    // Log
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "FAMILY_INVITE_SENT",
          entity: "InviteToken",
          targetId: invite.id,
          details: {
            invitedEmail: inviteEmail,
            invitedName: inviteName,
            tenantId,
          },
        },
      });
    } catch (logErr) {
      console.warn("⚠️ Error logging family invite:", logErr);
    }

    return NextResponse.json({
      ok: true,
      message: "Invitación enviada",
      invite: {
        id: invite.id,
        email: inviteEmail,
        expiresAt: invite.expiresAt.toISOString(),
      },
      inviteUrl,
      mailtoLink,
      spotsRemaining: maxMembers - totalMembers - 1,
    });
  } catch (err: any) {
    console.error("❌ Error POST /api/family/invite:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error enviando invitación" },
      { status: 500 }
    );
  }
}
