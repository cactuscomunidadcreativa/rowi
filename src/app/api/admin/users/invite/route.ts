import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";
import { sendInviteEmail } from "@/lib/email/sendInviteEmail";
import { assertSeatAvailable } from "@/lib/licensing/seats";
import crypto from "crypto";

export const runtime = "nodejs";

/* =========================================================
   📨 GET → Listar invitaciones activas
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const url = new URL(req.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const invites = await prisma.inviteToken.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invites);
  } catch (e: any) {
    console.error("❌ [GET /admin/users/invite] Error:", e);
    return NextResponse.json(
      { error: e?.message || "Error al listar invitaciones" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST → Crear invitación (token único + expiry)
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { email, tenantId, role = "VIEWER", planId, expiresInDays = 7 } = body;

    if (!email) return NextResponse.json({ error: "Falta email" }, { status: 400 });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 400 }
      );

    // 🎫 Licencias por asiento: si el invite es a una org con plan de
    // asientos (licenseCount > 0), no permitir invitar si ya están todos
    // ocupados. licenseCount = 0 → sin límite (B2C / legacy).
    if (tenantId) {
      const seat = await assertSeatAvailable(tenantId);
      if (!seat.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: "no_seats",
            message: `No hay licencias disponibles (${seat.summary?.used}/${seat.summary?.purchased}). Compra más asientos para invitar a más personas.`,
            seats: seat.summary,
          },
          { status: 402 },
        );
      }
    }

    // 🔄 Re-invite: si ya hay tokens pendientes (mismo email + tenantId,
    // no revocados, no aceptados, no expirados), márcalos como revocados
    // antes de crear el nuevo. Mantiene historial y evita confusión con
    // varios links válidos a la vez. Loggea en ActivityLog.
    const now = new Date();
    const lowerEmail = String(email).toLowerCase();
    const previousPending = await prisma.inviteToken.findMany({
      where: {
        email: lowerEmail,
        tenantId: tenantId || null,
        revokedAt: null,
        acceptedAt: null,
        expiresAt: { gt: now },
      },
      select: { id: true },
    });
    if (previousPending.length > 0) {
      const ids = previousPending.map((p) => p.id);
      await prisma.inviteToken.updateMany({
        where: { id: { in: ids } },
        data: { revokedAt: now },
      });
      try {
        await prisma.activityLog.createMany({
          data: ids.map((targetId) => ({
            userId: actor.id,
            action: "INVITE_REVOKED",
            entity: "InviteToken",
            targetId,
            details: { reason: "replaced_by_new_invite", email: lowerEmail, tenantId: tenantId || null },
          })),
        });
      } catch (logErr) {
        console.warn("[POST /admin/users/invite] activity log fail:", logErr);
      }
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const invite = await prisma.inviteToken.create({
      data: {
        userId: actor.id,
        tenantId: tenantId || null,
        email: email.toLowerCase(),
        role,
        token,
        expiresAt,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true, slug: true } },
      },
    });

    // Enviar email de invitación (reusa el helper compartido)
    const link = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/invite/${token}`;
    const emailResult = await sendInviteEmail({
      to: email.toLowerCase(),
      inviteUrl: link,
      inviterName: actor.name || actor.email,
      workspaceName: invite.tenant?.name || null,
      role,
      locale: (actor.language as any) || "es",
    });

    return NextResponse.json({
      ok: true,
      message: "Invitación generada correctamente ✅",
      invite,
      link,
      emailSent: emailResult.ok && !emailResult.skipped,
      emailSkipped: !!emailResult.skipped,
      emailError: emailResult.ok ? undefined : emailResult.error,
    });
  } catch (e: any) {
    console.error("❌ [POST /admin/users/invite] Error:", e);
    return NextResponse.json(
      { error: e?.message || "Error al crear invitación" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE → Revocar invitación
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Falta ID de invitación" }, { status: 400 });

    await prisma.inviteToken.delete({ where: { id } });

    return NextResponse.json({
      ok: true,
      message: "Invitación eliminada correctamente 🗑️",
    });
  } catch (e: any) {
    console.error("❌ [DELETE /admin/users/invite] Error:", e);
    return NextResponse.json(
      { error: e?.message || "Error al eliminar invitación" },
      { status: 500 }
    );
  }
}