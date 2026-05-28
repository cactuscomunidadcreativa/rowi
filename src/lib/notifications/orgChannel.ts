// src/lib/notifications/orgChannel.ts
// ============================================================
// Notificaciones a nivel ORGANIZACIÓN (canal compartido).
//
// A diferencia de NotificationService (que entrega por usuario según
// sus NotificationPreference), esto envía a los webhooks de Slack/Teams
// configurados en el Tenant — para alertas agregadas tipo HR:
// "el equipo X tiene Vital Signs bajos", "N empleados sin medición".
//
// Reusa los providers sendSlack / sendTeams de integrations.ts.
// ============================================================

import { prisma } from "@/core/prisma";
import { secureLog } from "@/lib/logging";
import { sendSlack, sendTeams } from "./providers/integrations";
import type { NotificationType } from "@prisma/client";

export interface OrgChannelInput {
  tenantId: string;
  /** Tipo de notificación (para la etiqueta de contexto en el mensaje). */
  type: NotificationType;
  title: string;
  message: string;
  /** Ruta relativa a la que apunta el botón de acción (ej. /hub/hr). */
  actionUrl?: string;
  locale?: string;
}

export interface OrgChannelResult {
  ok: boolean;
  delivered: ("slack" | "teams")[];
  skipped: boolean;
  errors?: string[];
}

/**
 * Envía una notificación al/los canal(es) de organización del tenant.
 * Respeta `orgNotifyEnabled`. Si no hay webhooks o está deshabilitado,
 * devuelve `skipped: true` sin error (el llamador puede ignorarlo).
 */
export async function notifyOrgChannel(
  input: OrgChannelInput,
): Promise<OrgChannelResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    select: {
      orgSlackWebhookUrl: true,
      orgTeamsWebhookUrl: true,
      orgNotifyEnabled: true,
    },
  });

  if (!tenant || !tenant.orgNotifyEnabled) {
    return { ok: true, delivered: [], skipped: true };
  }

  const hasSlack = !!tenant.orgSlackWebhookUrl;
  const hasTeams = !!tenant.orgTeamsWebhookUrl;
  if (!hasSlack && !hasTeams) {
    return { ok: true, delivered: [], skipped: true };
  }

  // Objeto compatible con los providers (id sintético, no persiste).
  const base = {
    id: `org-${input.tenantId}-${Date.now()}`,
    userId: "", // no aplica a nivel org
    type: input.type,
    title: input.title,
    message: input.message,
    metadata: null,
    actionUrl: input.actionUrl ?? null,
    locale: input.locale ?? "es",
  };

  const delivered: ("slack" | "teams")[] = [];
  const errors: string[] = [];

  if (hasSlack) {
    const r = await sendSlack({
      ...base,
      recipient: { slackWebhook: tenant.orgSlackWebhookUrl! },
    });
    if (r.success) delivered.push("slack");
    else errors.push(`slack: ${r.error}`);
  }

  if (hasTeams) {
    const r = await sendTeams({
      ...base,
      recipient: { teamsWebhook: tenant.orgTeamsWebhookUrl! },
    });
    if (r.success) delivered.push("teams");
    else errors.push(`teams: ${r.error}`);
  }

  secureLog.info(
    `[org-channel] tenant=${input.tenantId} type=${input.type} delivered=[${delivered.join(",")}]${errors.length ? ` errors=${errors.length}` : ""}`,
  );

  return {
    ok: errors.length === 0,
    delivered,
    skipped: false,
    errors: errors.length ? errors : undefined,
  };
}
