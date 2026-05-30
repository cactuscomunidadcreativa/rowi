/**
 * =============================================================
 * AI Culture Config — resolución con herencia (módulo compartido)
 * =============================================================
 *
 * Extraído de src/app/api/admin/ai/culture/route.ts para poder reusar la
 * resolución de cultura tanto en el endpoint admin como en runtime
 * (/api/rowi). NO dupliques esta lógica; impórtala.
 *
 * La cultura se hereda team → organization → hub → tenant → global, donde
 * el scope más específico gana campo por campo.
 */

import { prisma } from "@/core/prisma";

export type CultureScope = "global" | "tenant" | "hub" | "organization" | "team";

export const CULTURE_SCOPE_HIERARCHY: CultureScope[] = [
  "team",
  "organization",
  "hub",
  "tenant",
  "global",
];

export interface ResolvedCulture {
  mission: string;
  vision: string;
  values: string[];
  tone: string;
  keywords: string[];
  guidelines: string;
  restrictions: string;
  language: string;
  industry: string;
}

export const DEFAULT_CULTURE: ResolvedCulture = {
  mission: "",
  vision: "",
  values: [],
  tone: "professional",
  keywords: [],
  guidelines: "",
  restrictions: "",
  language: "es",
  industry: "",
};

/**
 * Resuelve los IDs de toda la jerarquía de scope a partir de un scope+id.
 * Ej: dado hub:X devuelve { hub: X, tenant: <tenant del hub> }.
 */
export async function getScopeHierarchyIds(
  scope: CultureScope,
  scopeId: string | null,
): Promise<Record<string, string | null>> {
  const ids: Record<string, string | null> = {
    global: null,
    tenant: null,
    hub: null,
    organization: null,
    team: null,
  };

  if (!scopeId || scope === "global") return ids;

  try {
    switch (scope) {
      case "team":
      case "organization": {
        const org = await prisma.organization.findUnique({
          where: { id: scopeId },
          select: { id: true, hubId: true, hub: { select: { tenantId: true } } },
        });
        if (org) {
          if (scope === "team") ids.team = org.id;
          else ids.organization = org.id;
          ids.hub = org.hubId;
          ids.tenant = org.hub?.tenantId || null;
        }
        break;
      }
      case "hub": {
        const hub = await prisma.hub.findUnique({
          where: { id: scopeId },
          select: { id: true, tenantId: true },
        });
        if (hub) {
          ids.hub = hub.id;
          ids.tenant = hub.tenantId;
        }
        break;
      }
      case "tenant":
        ids.tenant = scopeId;
        break;
    }
  } catch (error) {
    console.error("[getScopeHierarchyIds] Error:", error);
  }

  return ids;
}

/**
 * Resuelve la cultura efectiva con herencia. El scope más específico
 * (team) gana sobre el más general (global), campo por campo.
 */
export async function resolveCultureWithInheritance(
  scope: CultureScope,
  scopeId: string | null,
): Promise<ResolvedCulture> {
  const resolved: ResolvedCulture = JSON.parse(JSON.stringify(DEFAULT_CULTURE));

  const scopeIds = await getScopeHierarchyIds(scope, scopeId);
  // De general (global) a específico (team), para que lo específico sobreescriba.
  const orderedScopes = [...CULTURE_SCOPE_HIERARCHY].reverse();

  for (const currentScope of orderedScopes) {
    const currentScopeId = scopeIds[currentScope];
    if (currentScope !== "global" && !currentScopeId) continue;

    const config = await prisma.aiCultureConfig.findFirst({
      where: {
        scope: currentScope,
        scopeId: currentScope === "global" ? null : currentScopeId,
        isActive: true,
      },
    });
    if (!config) continue;

    if (config.mission) resolved.mission = config.mission;
    if (config.vision) resolved.vision = config.vision;
    if (config.values && (config.values as string[]).length > 0)
      resolved.values = config.values as string[];
    if (config.tone) resolved.tone = config.tone;
    if (config.keywords && (config.keywords as string[]).length > 0)
      resolved.keywords = config.keywords as string[];
    if (config.guidelines) resolved.guidelines = config.guidelines;
    if (config.restrictions) resolved.restrictions = config.restrictions;
    if (config.language) resolved.language = config.language;
    if (config.industry) resolved.industry = config.industry;
  }

  return resolved;
}

/** True si la cultura tiene algún contenido más allá de los defaults. */
export function cultureHasContent(c: ResolvedCulture): boolean {
  return Boolean(
    c.mission ||
      c.vision ||
      c.values.length ||
      c.keywords.length ||
      c.guidelines ||
      c.restrictions ||
      c.industry ||
      (c.tone && c.tone !== DEFAULT_CULTURE.tone),
  );
}
