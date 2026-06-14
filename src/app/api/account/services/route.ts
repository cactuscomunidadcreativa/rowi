// src/app/api/account/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";
import { telemetry } from "@/lib/telemetry";
import { rateLimit, getUserIdentifier } from "@/lib/security/rateLimit";
import { sendContextNotification } from "@/lib/email/sendContextNotification";

export const runtime = "nodejs";

const VALID_ROLES = new Set([
  "coach",
  "consultant",
  "mentor",
  "facilitator",
  "trainer",
  "advisor",
]);

const VALID_STATUS = new Set(["active", "paused", "ended", "proposed"]);

const ENGAGEMENT_SELECT = {
  id: true,
  serviceRole: true,
  status: true,
  startDate: true,
  endDate: true,
  hourlyRate: true,
  currency: true,
  scope: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  provider: {
    select: { id: true, name: true, email: true, image: true },
  },
  clientTenant: { select: { id: true, name: true, slug: true } },
  clientCommunity: { select: { id: true, name: true, workspaceType: true } },
  clientOrganization: { select: { id: true, name: true, slug: true } },
  clientUser: { select: { id: true, name: true, email: true, image: true } },
} as const;

/**
 * GET /api/account/services
 *
 * Returns two arrays:
 * - asProvider: engagements where the caller provides the service
 * - asClient:   engagements where the caller receives 1:1 service
 *
 * Tenant/community/org-scoped engagements are visible to the
 * provider only — the org admin sees them via their own admin
 * surface (not this endpoint, which is account-scoped).
 */
export async function GET() {
  const auth = await getServerAuthUser();
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "No autenticado" },
      { status: 401 },
    );
  }

  const [asProvider, asClient] = await Promise.all([
    prisma.serviceEngagement.findMany({
      where: { providerId: auth.id },
      orderBy: { createdAt: "desc" },
      select: ENGAGEMENT_SELECT,
    }),
    prisma.serviceEngagement.findMany({
      where: { clientUserId: auth.id },
      orderBy: { createdAt: "desc" },
      select: ENGAGEMENT_SELECT,
    }),
  ]);

  return NextResponse.json({ ok: true, asProvider, asClient });
}

/**
 * POST /api/account/services
 *
 * Body: { serviceRole, clientTenantId? | clientCommunityId? |
 *         clientOrganizationId? | clientUserId?, startDate?, endDate?,
 *         hourlyRate?, currency?, scope?, notes? }
 *
 * The caller is the provider. Exactly one client target is required.
 * Status starts as "proposed" so the client can accept (turn active)
 * — except when the client is the provider's own primary tenant,
 * where it starts active without ceremony.
 */
export async function POST(req: NextRequest) {
  const auth = await getServerAuthUser();
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "No autenticado" },
      { status: 401 },
    );
  }

  // Rate limit: 20 engagements per user per hour. A coach onboarding
  // an entire cohort might legitimately create ~10-15 in a session, so
  // 20 leaves headroom; bots fanning out engagements get stopped.
  const rl = await rateLimit(getUserIdentifier(req, auth.id), {
    limit: 20,
    window: 3600,
    prefix: "service_create",
  });
  if (!rl.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Demasiados engagements creados. Intenta de nuevo más tarde.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      },
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

  const serviceRole = (body.serviceRole || "").trim();
  if (!VALID_ROLES.has(serviceRole)) {
    return NextResponse.json(
      { ok: false, error: "serviceRole inválido" },
      { status: 400 },
    );
  }

  const clientTenantId = body.clientTenantId || null;
  const clientCommunityId = body.clientCommunityId || null;
  const clientOrganizationId = body.clientOrganizationId || null;
  const clientUserId = body.clientUserId || null;

  const clientCount = [
    clientTenantId,
    clientCommunityId,
    clientOrganizationId,
    clientUserId,
  ].filter(Boolean).length;

  if (clientCount !== 1) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Debe especificarse exactamente un cliente (tenant, community, organization o user)",
      },
      { status: 400 },
    );
  }

  if (clientUserId === auth.id) {
    return NextResponse.json(
      { ok: false, error: "No puedes ser proveedor y cliente de ti mismo" },
      { status: 400 },
    );
  }

  // Verify referenced entity exists — silently failing here would just
  // create a dangling engagement.
  const validators: Promise<unknown>[] = [];
  if (clientTenantId) {
    validators.push(
      prisma.tenant
        .findUnique({ where: { id: clientTenantId }, select: { id: true } })
        .then((t) => {
          if (!t) throw new Error("Tenant no encontrado");
        }),
    );
  }
  if (clientCommunityId) {
    validators.push(
      prisma.rowiCommunity
        .findUnique({
          where: { id: clientCommunityId },
          select: { id: true },
        })
        .then((c) => {
          if (!c) throw new Error("Community no encontrada");
        }),
    );
  }
  if (clientOrganizationId) {
    validators.push(
      prisma.organization
        .findUnique({
          where: { id: clientOrganizationId },
          select: { id: true },
        })
        .then((o) => {
          if (!o) throw new Error("Organization no encontrada");
        }),
    );
  }
  if (clientUserId) {
    validators.push(
      prisma.user
        .findUnique({ where: { id: clientUserId }, select: { id: true } })
        .then((u) => {
          if (!u) throw new Error("User no encontrado");
        }),
    );
  }

  try {
    await Promise.all(validators);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Cliente inválido" },
      { status: 400 },
    );
  }

  const status =
    clientTenantId && clientTenantId === auth.primaryTenantId
      ? "active"
      : "proposed";

  try {
    const created = await prisma.serviceEngagement.create({
      data: {
        providerId: auth.id,
        serviceRole,
        clientTenantId,
        clientCommunityId,
        clientOrganizationId,
        clientUserId,
        status,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        hourlyRate:
          typeof body.hourlyRate === "number" ? body.hourlyRate : null,
        currency: body.currency || "USD",
        scope: (body.scope || "").trim() || null,
        notes: (body.notes || "").trim() || null,
      },
      select: ENGAGEMENT_SELECT,
    });
    // Notify the client side if the engagement starts as "proposed".
    // Only the user-as-client kind gets an email here — tenant/community
    // /org clients are notified through their own admin surfaces.
    if (
      created.status === "proposed" &&
      created.clientUser?.email &&
      created.clientUser.id
    ) {
      const ctaUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.rowiia.com"}/settings/services`;
      const recipient = await prisma.user.findUnique({
        where: { id: created.clientUser.id },
        select: { preferredLang: true, language: true },
      });
      sendContextNotification({
        to: created.clientUser.email,
        kind: "service.proposed",
        actorName: created.provider?.name,
        detail: created.serviceRole,
        ctaUrl,
        locale: recipient?.preferredLang || recipient?.language || "es",
      }).catch((e) => {
        telemetry.captureException(e, { route: "/api/account/services", op: "notify_service_proposed", fatal: false });
      });
    }

    return NextResponse.json({ ok: true, engagement: created });
  } catch (err: any) {
    telemetry.captureException(err, { route: "/api/account/services", op: "POST" });
    return NextResponse.json(
      { ok: false, error: err?.message || "Error interno" },
      { status: 500 },
    );
  }
}
