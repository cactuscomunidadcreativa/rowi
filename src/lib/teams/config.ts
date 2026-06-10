/**
 * 💬 Microsoft Teams — config (Incoming Webhook).
 *
 * Modo simple sin app de Azure: el admin pega la URL del Incoming Webhook de un
 * canal de Teams y Rowi postea ahí. La conexión vive en IntegrationConnection
 * (platform=TEAMS), por tenant. Espejo conceptual de lib/slack/config.ts pero
 * por webhook en vez de OAuth.
 *
 * El webhookUrl se guarda en la columna webhookUrl del modelo. No es un secreto
 * de alto valor (es una URL con token embebido), pero igual no se devuelve al
 * cliente desde el status — solo el booleano + nombre del canal.
 */
import { prisma } from "@/core/prisma";

export interface TeamsConnection {
  id: string;
  channelName: string | null;
  webhookUrl: string;
  status: string;
}

/** Devuelve la conexión Teams activa de un tenant, o null. */
export async function getTeamsConnection(tenantId: string): Promise<TeamsConnection | null> {
  const conn = await prisma.integrationConnection.findFirst({
    where: { tenantId, platform: "TEAMS", status: "connected" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, channelName: true, webhookUrl: true, status: true },
  });
  if (!conn?.webhookUrl) return null;
  return {
    id: conn.id,
    channelName: conn.channelName,
    webhookUrl: conn.webhookUrl,
    status: conn.status,
  };
}

/** Crea/actualiza la conexión Teams de un tenant con una Incoming Webhook URL. */
export async function upsertTeamsConnection(args: {
  tenantId: string;
  userId: string | null;
  webhookUrl: string;
  channelName?: string | null;
}): Promise<TeamsConnection> {
  const existing = await prisma.integrationConnection.findFirst({
    where: { tenantId: args.tenantId, platform: "TEAMS" },
    select: { id: true },
  });

  const data = {
    tenantId: args.tenantId,
    userId: args.userId,
    platform: "TEAMS" as const,
    name: args.channelName || "Microsoft Teams",
    status: "connected",
    webhookUrl: args.webhookUrl,
    channelName: args.channelName ?? null,
  };

  const conn = existing
    ? await prisma.integrationConnection.update({ where: { id: existing.id }, data })
    : await prisma.integrationConnection.create({ data });

  return {
    id: conn.id,
    channelName: conn.channelName,
    webhookUrl: conn.webhookUrl!,
    status: conn.status,
  };
}

/** Valida que una URL parezca un Incoming Webhook de Teams. */
export function isValidTeamsWebhook(url: string): boolean {
  try {
    const u = new URL(url);
    // Webhooks de Teams: *.webhook.office.com o *.logic.azure.com (Workflows).
    return (
      u.protocol === "https:" &&
      (u.hostname.endsWith("webhook.office.com") ||
        u.hostname.endsWith("logic.azure.com") ||
        u.hostname.endsWith("office.com"))
    );
  } catch {
    return false;
  }
}
