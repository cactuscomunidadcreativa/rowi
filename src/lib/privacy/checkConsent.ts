/**
 * Server-side helpers para verificar consents activos.
 *
 * Convención: el consent está "activo" si existe un UserConsent con
 *   granted=true, revokedAt=null, version >= versión actual del descriptor.
 *
 * - canSendMarketing(userId): chequea marketing_communications. Úsalo antes
 *   de meter a un usuario en una lista de broadcast.
 *
 * - canContributeToBenchmark(userId): chequea benchmarking_contribution.
 *   Úsalo como filtro en agregados que alimentan benchmarks externos.
 *
 * - hasResearchLensConsent(userId): chequea research_lens. Úsalo en
 *   /research/cases y derivados antes de exponer datos del usuario.
 *
 * - hasBasicProcessing(userId): chequea basic_processing. Usable para
 *   gates server-side adicionales (el ConsentGate client-side cubre la UI).
 */
import { prisma } from "@/core/prisma";
import { CONSENTS, type ConsentKey } from "@/lib/privacy/consents";

async function isGranted(userId: string, key: ConsentKey): Promise<boolean> {
  const descriptor = CONSENTS.find((c) => c.key === key);
  if (!descriptor) return false;
  const last = await prisma.userConsent.findFirst({
    where: { userId, consentKey: key },
    orderBy: { grantedAt: "desc" },
    select: { granted: true, revokedAt: true, version: true },
  });
  if (!last) return false;
  if (!last.granted) return false;
  if (last.revokedAt) return false;
  if (last.version < descriptor.version) return false;
  return true;
}

export function canSendMarketing(userId: string): Promise<boolean> {
  return isGranted(userId, "marketing_communications");
}

export function canContributeToBenchmark(userId: string): Promise<boolean> {
  return isGranted(userId, "benchmarking_contribution");
}

export function hasResearchLensConsent(userId: string): Promise<boolean> {
  return isGranted(userId, "research_lens");
}

export function hasBasicProcessing(userId: string): Promise<boolean> {
  return isGranted(userId, "basic_processing");
}

/**
 * Filter an array of userIds to only those who granted a specific consent.
 * Single query, useful when iterating many users for an aggregate or broadcast.
 */
export async function filterByConsent(
  userIds: string[],
  key: ConsentKey,
): Promise<string[]> {
  if (userIds.length === 0) return [];
  const descriptor = CONSENTS.find((c) => c.key === key);
  if (!descriptor) return [];
  const rows = await prisma.userConsent.findMany({
    where: {
      userId: { in: userIds },
      consentKey: key,
      granted: true,
      revokedAt: null,
      version: { gte: descriptor.version },
    },
    select: { userId: true },
  });
  const granted = new Set(rows.map((r) => r.userId));
  return userIds.filter((id) => granted.has(id));
}
