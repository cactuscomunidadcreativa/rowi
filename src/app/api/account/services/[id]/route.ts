// src/app/api/account/services/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";
import { telemetry } from "@/lib/telemetry";
import { sendContextNotification } from "@/lib/email/sendContextNotification";

export const runtime = "nodejs";

const VALID_STATUS = new Set(["active", "paused", "ended", "proposed"]);

const ENGAGEMENT_SELECT = {
  id: true,
  providerId: true,
  serviceRole: true,
  status: true,
  startDate: true,
  endDate: true,
  hourlyRate: true,
  currency: true,
  scope: true,
  notes: true,
  clientTenantId: true,
  clientCommunityId: true,
  clientOrganizationId: true,
  clientUserId: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function loadEngagement(id: string) {
  return prisma.serviceEngagement.findUnique({
    where: { id },
    select: ENGAGEMENT_SELECT,
  });
}

/**
 * PATCH /api/account/services/[id]
 *
 * Provider: can edit any field except status transitions reserved for
 * the client (proposed → active). Provider can set status to
 * paused/ended at any time.
 *
 * Client user (when clientUserId === auth.id): can only flip status
 * proposed → active (accept) or proposed → ended (decline). They can
 * also end an active engagement.
 *
 * Tenant/community/org-scoped engagements: only the provider can edit
 * via this endpoint — the org's admins manage from their own surfaces.
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await getServerAuthUser();
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "No autenticado" },
      { status: 401 },
    );
  }

  const { id } = await ctx.params;
  const engagement = await loadEngagement(id);
  if (!engagement) {
    return NextResponse.json(
      { ok: false, error: "Engagement no encontrado" },
      { status: 404 },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body JSON inválido" },
      { status: 400 },
    );
  }

  const isProvider = engagement.providerId === auth.id;
  const isClientUser =
    engagement.clientUserId && engagement.clientUserId === auth.id;

  if (!isProvider && !isClientUser) {
    return NextResponse.json(
      { ok: false, error: "No tienes acceso a este engagement" },
      { status: 403 },
    );
  }

  const data: Record<string, unknown> = {};

  if (isProvider) {
    if (typeof body.scope === "string") {
      data.scope = body.scope.trim() || null;
    }
    if (typeof body.notes === "string") {
      data.notes = body.notes.trim() || null;
    }
    if (typeof body.hourlyRate === "number") {
      data.hourlyRate = body.hourlyRate;
    }
    if (typeof body.currency === "string") {
      data.currency = body.currency.trim() || "USD";
    }
    if (body.startDate !== undefined) {
      data.startDate = body.startDate ? new Date(body.startDate) : null;
    }
    if (body.endDate !== undefined) {
      data.endDate = body.endDate ? new Date(body.endDate) : null;
    }
    if (typeof body.status === "string") {
      if (!VALID_STATUS.has(body.status)) {
        return NextResponse.json(
          { ok: false, error: "status inválido" },
          { status: 400 },
        );
      }
      data.status = body.status;
    }
  }

  if (isClientUser && typeof body.status === "string") {
    const next = body.status;
    if (!VALID_STATUS.has(next)) {
      return NextResponse.json(
        { ok: false, error: "status inválido" },
        { status: 400 },
      );
    }
    const allowed =
      (engagement.status === "proposed" &&
        (next === "active" || next === "ended")) ||
      (engagement.status === "active" && next === "ended");
    if (!allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: `Transición no permitida para cliente: ${engagement.status} → ${next}`,
        },
        { status: 400 },
      );
    }
    data.status = next;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { ok: false, error: "Nada que actualizar" },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.serviceEngagement.update({
      where: { id },
      data,
      select: ENGAGEMENT_SELECT,
    });

    // Notification policy:
    //   - Client accepts (proposed→active)  → notify provider
    //   - Client ends    (any→ended)        → notify provider
    //   - Provider ends  (any→ended)        → notify client user (if 1:1)
    if (data.status === "active" && isClientUser) {
      const provider = await prisma.user.findUnique({
        where: { id: engagement.providerId },
        select: { email: true, preferredLang: true, language: true },
      });
      if (provider?.email) {
        const ctaUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.rowiia.com"}/settings/services`;
        sendContextNotification({
          to: provider.email,
          kind: "service.accepted",
          actorName: auth.name,
          detail: updated.serviceRole,
          ctaUrl,
          locale: provider.preferredLang || provider.language || "es",
        }).catch((e) => {
          telemetry.captureException(e, { route: "/api/account/services/[id]", op: "notify_service_accepted", fatal: false });
        });
      }
    }
    if (data.status === "ended") {
      const ctaUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.rowiia.com"}/settings/services`;
      // Notify the other side.
      const otherSideUserId = isProvider
        ? engagement.clientUserId
        : engagement.providerId;
      if (otherSideUserId) {
        const otherUser = await prisma.user.findUnique({
          where: { id: otherSideUserId },
          select: { email: true, preferredLang: true, language: true },
        });
        if (otherUser?.email) {
          sendContextNotification({
            to: otherUser.email,
            kind: "service.ended",
            actorName: auth.name,
            detail: updated.serviceRole,
            ctaUrl,
            locale:
              otherUser.preferredLang || otherUser.language || "es",
          }).catch((e) => {
            telemetry.captureException(e, { route: "/api/account/services/[id]", op: "notify_service_ended", fatal: false });
          });
        }
      }
    }

    return NextResponse.json({ ok: true, engagement: updated });
  } catch (err: any) {
    telemetry.captureException(err, { route: "/api/account/services/[id]", op: "PATCH" });
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/account/services/[id]
 *
 * Only the provider can delete. The client ends it via status=ended.
 * This is intentionally strict — service history is useful and we
 * don't want the receiving side accidentally erasing it.
 */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await getServerAuthUser();
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "No autenticado" },
      { status: 401 },
    );
  }

  const { id } = await ctx.params;
  const engagement = await loadEngagement(id);
  if (!engagement) {
    return NextResponse.json(
      { ok: false, error: "Engagement no encontrado" },
      { status: 404 },
    );
  }

  if (engagement.providerId !== auth.id) {
    return NextResponse.json(
      { ok: false, error: "Solo el provider puede eliminar" },
      { status: 403 },
    );
  }

  await prisma.serviceEngagement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
