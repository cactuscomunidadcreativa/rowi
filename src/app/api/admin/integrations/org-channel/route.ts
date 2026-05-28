/**
 * 📣 API: Org notification channel config
 * GET  /api/admin/integrations/org-channel?tenantId=...  — lee config
 * POST /api/admin/integrations/org-channel                — guarda + test opcional
 *
 * Configura los webhooks de Slack/Teams a nivel organización (alertas
 * agregadas tipo HR). Scope-aware: el admin solo puede tocar tenants
 * dentro de su scope.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { tenantIdsForScope } from "@/core/admin/scopedList";
import {
  verifySlackWebhook,
  verifyTeamsWebhook,
} from "@/lib/notifications/providers/integrations";

export const dynamic = "force-dynamic";

async function assertTenantInScope(scope: any, tenantId: string): Promise<boolean> {
  const allowed = await tenantIdsForScope(scope);
  if (allowed === null) return true; // rowiverse scope: sin narrowing
  return allowed.includes(tenantId);
}

// =========================================================
// GET — leer config actual
// =========================================================
export async function GET(req: NextRequest) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  const tenantId = new URL(req.url).searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "tenantId requerido" }, { status: 400 });
  }
  if (!(await assertTenantInScope(auth.scope, tenantId))) {
    return NextResponse.json({ ok: false, error: "Tenant fuera de tu scope" }, { status: 403 });
  }

  const t = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { orgSlackWebhookUrl: true, orgTeamsWebhookUrl: true, orgNotifyEnabled: true },
  });
  if (!t) {
    return NextResponse.json({ ok: false, error: "Tenant no encontrado" }, { status: 404 });
  }

  // No devolvemos las URLs completas (pueden tener tokens); solo si están set.
  return NextResponse.json({
    ok: true,
    config: {
      slackConfigured: !!t.orgSlackWebhookUrl,
      teamsConfigured: !!t.orgTeamsWebhookUrl,
      enabled: t.orgNotifyEnabled,
    },
  });
}

// =========================================================
// POST — guardar config (+ test opcional)
// =========================================================
export async function POST(req: NextRequest) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const { tenantId, slackWebhookUrl, teamsWebhookUrl, enabled, test } = body as {
    tenantId?: string;
    slackWebhookUrl?: string | null;
    teamsWebhookUrl?: string | null;
    enabled?: boolean;
    test?: boolean;
  };

  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "tenantId requerido" }, { status: 400 });
  }
  if (!(await assertTenantInScope(auth.scope, tenantId))) {
    return NextResponse.json({ ok: false, error: "Tenant fuera de tu scope" }, { status: 403 });
  }

  // Validación básica de formato de webhook.
  if (slackWebhookUrl && !/^https:\/\/hooks\.slack\.com\//.test(slackWebhookUrl)) {
    return NextResponse.json(
      { ok: false, error: "URL de Slack inválida (debe ser hooks.slack.com)" },
      { status: 400 },
    );
  }
  if (teamsWebhookUrl && !/^https:\/\//.test(teamsWebhookUrl)) {
    return NextResponse.json(
      { ok: false, error: "URL de Teams inválida" },
      { status: 400 },
    );
  }

  // Test opcional ANTES de guardar — para que el admin valide la URL.
  if (test) {
    const results: Record<string, boolean> = {};
    if (slackWebhookUrl) results.slack = await verifySlackWebhook(slackWebhookUrl);
    if (teamsWebhookUrl) results.teams = await verifyTeamsWebhook(teamsWebhookUrl);
    return NextResponse.json({ ok: true, test: results });
  }

  const data: Record<string, unknown> = {};
  if (slackWebhookUrl !== undefined) data.orgSlackWebhookUrl = slackWebhookUrl || null;
  if (teamsWebhookUrl !== undefined) data.orgTeamsWebhookUrl = teamsWebhookUrl || null;
  if (enabled !== undefined) data.orgNotifyEnabled = enabled;

  await prisma.tenant.update({ where: { id: tenantId }, data });

  return NextResponse.json({ ok: true, message: "Configuración guardada" });
}
