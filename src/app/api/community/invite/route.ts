// src/app/api/community/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import crypto from "crypto";

export const runtime = "nodejs";

/* =========================================================
   📧 Sistema de invitaciones con soporte para Email y WhatsApp/SMS
   ---------------------------------------------------------
   POST → Crear invitación
   GET  → Listar invitaciones enviadas por el usuario
========================================================= */

type InviteChannel = "email" | "whatsapp" | "sms";

function detectChannel(contact: string): InviteChannel {
  const c = contact.trim();
  // Si contiene @ es email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return "email";
  // Si empieza con + o tiene muchos dígitos, es teléfono
  const digits = c.replace(/[^\d+]/g, "");
  if (/^\+?\d{8,15}$/.test(digits)) return "whatsapp"; // Por defecto WhatsApp para teléfonos
  throw new Error("Contacto inválido. Usa email o teléfono con código de país (+XX...)");
}

function normalizePhone(phone: string): string {
  // Eliminar todo excepto números y +
  return phone.replace(/[^\d+]/g, "");
}

function makeBaseUrl(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

/* =========================================================
   GET → Listar invitaciones del usuario
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, primaryTenantId: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Buscar invitaciones creadas por este usuario
    const invites = await prisma.inviteToken.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Para cada invitación, verificar si ya fue aceptada (usuario existe con ese email)
    const invitesWithStatus = await Promise.all(
      invites.map(async (inv) => {
        const accepted = await prisma.user.findUnique({
          where: { email: inv.email },
          select: { id: true, name: true, createdAt: true },
        });

        return {
          id: inv.id,
          token: inv.token,
          contact: inv.email,
          channel: inv.email.includes("@") ? "email" : "whatsapp",
          role: inv.role,
          createdAt: inv.createdAt.toISOString(),
          expiresAt: inv.expiresAt.toISOString(),
          status: accepted ? "accepted" : new Date() > inv.expiresAt ? "expired" : "pending",
          acceptedBy: accepted
            ? { id: accepted.id, name: accepted.name, joinedAt: accepted.createdAt?.toISOString() }
            : null,
        };
      })
    );

    // Estadísticas
    const stats = {
      total: invitesWithStatus.length,
      pending: invitesWithStatus.filter((i) => i.status === "pending").length,
      accepted: invitesWithStatus.filter((i) => i.status === "accepted").length,
      expired: invitesWithStatus.filter((i) => i.status === "expired").length,
    };

    return NextResponse.json({
      ok: true,
      invites: invitesWithStatus,
      stats,
    });
  } catch (e: any) {
    console.error("❌ GET /api/community/invite error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

/* =========================================================
   POST → Crear nueva invitación
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        plan: true,
        memberships: { include: { tenant: true } },
      },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const contact = (body.contact as string)?.trim();
    const name = (body.name as string)?.trim();
    const message = (body.message as string)?.trim();
    const preferredChannel = body.channel as InviteChannel | undefined;

    if (!contact) {
      return NextResponse.json({ ok: false, error: "Contact is required" }, { status: 400 });
    }

    // Detectar canal de comunicación
    let channel: InviteChannel;
    try {
      channel = preferredChannel || detectChannel(contact);
    } catch (err: any) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    }

    // Verificar límites del plan
    const planLimits = user.plan?.meta as any;
    const maxInvites = planLimits?.maxInvites ?? 10; // Default: 10 invitaciones

    const existingInvites = await prisma.inviteToken.count({
      where: { userId: user.id },
    });

    if (existingInvites >= maxInvites) {
      return NextResponse.json(
        {
          ok: false,
          error: `Has alcanzado el límite de ${maxInvites} invitaciones de tu plan`,
          limitReached: true,
        },
        { status: 403 }
      );
    }

    // Verificar si ya existe una invitación pendiente para este contacto
    const normalizedContact = channel === "email" ? contact.toLowerCase() : normalizePhone(contact);
    const existing = await prisma.inviteToken.findFirst({
      where: {
        userId: user.id,
        email: normalizedContact,
        expiresAt: { gt: new Date() },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          error: "Ya existe una invitación pendiente para este contacto",
          existingInvite: existing.id,
        },
        { status: 409 }
      );
    }

    // Crear token de invitación
    const inviteToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expira en 7 días

    const invite = await prisma.inviteToken.create({
      data: {
        userId: user.id,
        tenantId: user.primaryTenantId,
        email: normalizedContact,
        token: inviteToken,
        role: "USER",
        expiresAt,
      },
    });

    // Generar URL de invitación
    const baseUrl = makeBaseUrl(req);
    const inviteUrl = `${baseUrl}/invite/${inviteToken}`;

    // Mensaje personalizado
    const inviterName = user.name || email.split("@")[0];
    const defaultMessage =
      channel === "email"
        ? `¡Hola${name ? ` ${name}` : ""}! ${inviterName} te invita a unirte a Rowi. Crea tu perfil aquí: ${inviteUrl}`
        : `¡Hola${name ? ` ${name}` : ""}! 🌱 ${inviterName} te invita a Rowi. Únete aquí: ${inviteUrl}`;

    const finalMessage = message || defaultMessage;

    // Generar links para enviar
    const links: Record<string, string | null> = {
      email: null,
      whatsapp: null,
      sms: null,
    };

    if (channel === "email") {
      const subject = encodeURIComponent(`${inviterName} te invita a Rowi`);
      const bodyEncoded = encodeURIComponent(finalMessage);
      links.email = `mailto:${normalizedContact}?subject=${subject}&body=${bodyEncoded}`;
    } else {
      // WhatsApp
      const phone = normalizedContact.replace("+", "");
      links.whatsapp = `https://wa.me/${phone}?text=${encodeURIComponent(finalMessage)}`;
      // SMS
      links.sms = `sms:${normalizedContact}?body=${encodeURIComponent(finalMessage)}`;
    }

    // Registrar en ActivityLog para hub admin
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "INVITE_SENT",
          entity: "InviteToken",
          targetId: invite.id,
          details: {
            channel,
            contact: normalizedContact,
            inviteName: name || null,
            tenantId: user.primaryTenantId,
          },
        },
      });
    } catch (logErr) {
      console.warn("⚠️ Error logging invite activity:", logErr);
    }

    return NextResponse.json({
      ok: true,
      invite: {
        id: invite.id,
        token: inviteToken,
        contact: normalizedContact,
        channel,
        expiresAt: invite.expiresAt.toISOString(),
        createdAt: invite.createdAt.toISOString(),
      },
      inviteUrl,
      message: finalMessage,
      links,
      remainingInvites: maxInvites - existingInvites - 1,
    });
  } catch (e: any) {
    console.error("❌ POST /api/community/invite error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

/* =========================================================
   DELETE → Cancelar/eliminar invitación
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const inviteId = body.inviteId as string;

    if (!inviteId) {
      return NextResponse.json({ ok: false, error: "inviteId required" }, { status: 400 });
    }

    // Verificar que la invitación pertenece al usuario
    const invite = await prisma.inviteToken.findFirst({
      where: { id: inviteId, userId: user.id },
    });

    if (!invite) {
      return NextResponse.json({ ok: false, error: "Invite not found" }, { status: 404 });
    }

    await prisma.inviteToken.delete({ where: { id: inviteId } });

    // Log
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "INVITE_CANCELLED",
          entity: "InviteToken",
          targetId: inviteId,
          details: { contact: invite.email },
        },
      });
    } catch (logErr) {
      console.warn("⚠️ Error logging invite cancellation:", logErr);
    }

    return NextResponse.json({ ok: true, deleted: inviteId });
  } catch (e: any) {
    console.error("❌ DELETE /api/community/invite error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
