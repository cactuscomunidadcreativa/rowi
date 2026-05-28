/**
 * API: Re-invitación
 * POST /api/admin/invites/[id]/resend
 *
 * Marca el invite original como revocado y crea un nuevo InviteToken con
 * el mismo email / tenantId / role, refrescando expiry. Dispara el email
 * de invitación con el nuevo link.
 *
 * Scope-aware: requireAdminWithScope + tenantIdsForScope (mismo patrón que
 * DELETE /api/admin/invites). El endpoint es la contrapartida positiva de
 * DELETE — en lugar de eliminar la invitación, la reemplaza.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { tenantIdsForScope } from "@/core/admin/scopedList";
import { sendInviteEmail } from "@/lib/email/sendInviteEmail";
import { getServerAppBaseUrl } from "@/core/utils/base-url";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminWithScope();
    if (auth.error) return auth.error;
    const actor = auth.user;

    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Falta el ID de la invitación" },
        { status: 400 },
      );
    }

    const original = await prisma.inviteToken.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!original) {
      return NextResponse.json(
        { ok: false, error: "Invitación no encontrada" },
        { status: 404 },
      );
    }

    // Scope check — la invitación debe estar en un tenant administrable.
    const allowed = await tenantIdsForScope(auth.scope);
    if (allowed !== null) {
      if (!original.tenantId || !allowed.includes(original.tenantId)) {
        return NextResponse.json(
          { ok: false, error: "Invitación fuera de tu scope" },
          { status: 403 },
        );
      }
    }

    if (original.acceptedAt) {
      return NextResponse.json(
        { ok: false, error: "La invitación ya fue aceptada — no se puede reenviar" },
        { status: 400 },
      );
    }

    const now = new Date();
    // Calcular expiresInDays para mantener el mismo plazo que la original
    // (default 7 si la original era demasiado vieja o si el cálculo queda <1).
    const originalSpanMs = original.expiresAt.getTime() - original.createdAt.getTime();
    const originalSpanDays = Math.round(originalSpanMs / (24 * 60 * 60 * 1000));
    const expiresInDays = originalSpanDays > 0 ? originalSpanDays : 7;
    const newExpiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);
    const token = crypto.randomBytes(24).toString("hex");

    // Marcar la vieja como revocada (no la borramos para mantener historial).
    if (!original.revokedAt) {
      await prisma.inviteToken.update({
        where: { id },
        data: { revokedAt: now },
      });
      try {
        await prisma.activityLog.create({
          data: {
            userId: actor.id,
            action: "INVITE_REVOKED",
            entity: "InviteToken",
            targetId: id,
            details: {
              reason: "resend",
              email: original.email,
              tenantId: original.tenantId,
            },
          },
        });
      } catch (logErr) {
        console.warn("[POST /admin/invites/[id]/resend] activity log fail:", logErr);
      }
    }

    // Crear nuevo InviteToken
    const created = await prisma.inviteToken.create({
      data: {
        userId: actor.id,
        tenantId: original.tenantId,
        email: original.email,
        role: original.role,
        token,
        expiresAt: newExpiresAt,
      },
      select: { id: true, token: true, email: true, tenantId: true },
    });

    // Enviar email
    const link = `${getServerAppBaseUrl(req)}/invite/${token}`;
    const actorFull = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { language: true },
    });
    const emailResult = await sendInviteEmail({
      to: original.email,
      inviteUrl: link,
      inviterName: actor.name || actor.email,
      workspaceName: original.tenant?.name || null,
      role: original.role,
      locale: (actorFull?.language as any) || "es",
      expiresInDays,
    });

    return NextResponse.json({
      ok: true,
      newInviteId: created.id,
      link,
      emailSent: emailResult.ok && !emailResult.skipped,
      emailSkipped: !!emailResult.skipped,
      emailError: emailResult.ok ? undefined : emailResult.error,
    });
  } catch (err: any) {
    console.error("Error POST /api/admin/invites/[id]/resend:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Error al reenviar la invitación" },
      { status: 500 },
    );
  }
}
