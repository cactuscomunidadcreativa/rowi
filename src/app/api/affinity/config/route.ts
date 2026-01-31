/**
 * =============================================================
 * 🎯 Affinity Config API - Configuración por niveles jerárquicos
 * =============================================================
 *
 * GET    - Obtener configuración (con cascada de herencia)
 * POST   - Crear/actualizar configuración para un scope
 * DELETE - Eliminar configuración de un scope
 *
 * Jerarquía de herencia (de más específico a más general):
 * team → organization → hub → tenant → global
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

// Valores por defecto (global)
const DEFAULT_CONFIG = {
  contextWeights: {
    innovation: { growth: 0.40, collab: 0.35, understand: 0.25 },
    execution: { growth: 0.25, collab: 0.55, understand: 0.20 },
    leadership: { growth: 0.35, collab: 0.35, understand: 0.30 },
    conversation: { growth: 0.20, collab: 0.25, understand: 0.55 },
    relationship: { growth: 0.25, collab: 0.30, understand: 0.45 },
    decision: { growth: 0.30, collab: 0.45, understand: 0.25 },
  },
  learningParams: {
    windowDays: 30,
    highEffThreshold: 0.8,
    lowEffThreshold: 0.4,
    highBiasMultiplier: 1.08,
    lowBiasMultiplier: 0.92,
    cronIntervalDays: 15,
    maxMembersPerRun: 500,
  },
  bandThresholds: {
    hotThreshold: 70,
    warmThreshold: 45,
  },
  closenessMultipliers: {
    cercano: 1.0,
    neutral: 0.9,
    lejano: 0.75,
  },
};

type Scope = "global" | "tenant" | "hub" | "organization" | "team";

// Orden de cascada (de más específico a más general)
const SCOPE_HIERARCHY: Scope[] = ["team", "organization", "hub", "tenant", "global"];

/**
 * GET - Obtener configuración con herencia
 * Query params:
 *   - scope: "global" | "tenant" | "hub" | "organization" | "team"
 *   - scopeId: ID del scope (no requerido para global)
 *   - resolve: "true" para obtener config resuelta con herencia
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = (searchParams.get("scope") || "global") as Scope;
    const scopeId = searchParams.get("scopeId");
    const resolve = searchParams.get("resolve") === "true";

    // Si resolve=true, obtener config con herencia completa
    if (resolve) {
      const resolvedConfig = await resolveConfigWithInheritance(scope, scopeId);
      return NextResponse.json({
        ok: true,
        config: resolvedConfig.config,
        source: resolvedConfig.source,
        inheritance: resolvedConfig.inheritance,
      });
    }

    // Obtener config específica del scope
    const config = await prisma.affinityConfig.findFirst({
      where: {
        scope,
        scopeId: scope === "global" ? null : scopeId,
        isActive: true,
      },
    });

    if (!config) {
      return NextResponse.json({
        ok: true,
        config: null,
        defaults: DEFAULT_CONFIG,
        message: `No config found for ${scope}${scopeId ? `:${scopeId}` : ""}`,
      });
    }

    return NextResponse.json({
      ok: true,
      config: {
        id: config.id,
        scope: config.scope,
        scopeId: config.scopeId,
        contextWeights: config.contextWeights,
        learningParams: config.learningParams,
        bandThresholds: config.bandThresholds,
        closenessMultipliers: config.closenessMultipliers,
        description: config.description,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      },
    });
  } catch (error) {
    console.error("[AffinityConfig GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Crear o actualizar configuración
 * Body:
 *   - scope: "global" | "tenant" | "hub" | "organization" | "team"
 *   - scopeId: ID del scope (no requerido para global)
 *   - contextWeights: { [context]: { growth, collab, understand } }
 *   - learningParams: { windowDays, highEffThreshold, ... }
 *   - bandThresholds: { hotThreshold, warmThreshold }
 *   - closenessMultipliers: { cercano, neutral, lejano }
 *   - description: string (opcional)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      scope = "global",
      scopeId,
      contextWeights,
      learningParams,
      bandThresholds,
      closenessMultipliers,
      description,
    } = body;

    // Validar scope
    if (!SCOPE_HIERARCHY.includes(scope)) {
      return NextResponse.json(
        { error: `Invalid scope: ${scope}` },
        { status: 400 }
      );
    }

    // Validar scopeId para scopes no globales
    if (scope !== "global" && !scopeId) {
      return NextResponse.json(
        { error: `scopeId required for scope: ${scope}` },
        { status: 400 }
      );
    }

    // Preparar datos para upsert
    const configData: any = {
      scope,
      scopeId: scope === "global" ? null : scopeId,
      createdBy: user.id,
    };

    // Solo incluir campos que fueron enviados
    if (contextWeights) configData.contextWeights = contextWeights;
    if (learningParams) configData.learningParams = learningParams;
    if (bandThresholds) configData.bandThresholds = bandThresholds;
    if (closenessMultipliers) configData.closenessMultipliers = closenessMultipliers;
    if (description !== undefined) configData.description = description;

    // Agregar relaciones según el scope
    if (scope === "tenant" && scopeId) {
      configData.tenantId = scopeId;
    } else if (scope === "hub" && scopeId) {
      configData.hubId = scopeId;
    } else if (scope === "organization" && scopeId) {
      configData.organizationId = scopeId;
    }

    // Upsert (crear o actualizar)
    const config = await prisma.affinityConfig.upsert({
      where: {
        scope_scopeId: {
          scope,
          scopeId: scope === "global" ? null : scopeId,
        },
      },
      update: {
        ...configData,
        updatedAt: new Date(),
      },
      create: {
        ...configData,
        isActive: true,
      },
    });

    return NextResponse.json({
      ok: true,
      config,
      message: `Config ${config.id ? "updated" : "created"} for ${scope}${scopeId ? `:${scopeId}` : ""}`,
    });
  } catch (error) {
    console.error("[AffinityConfig POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Eliminar configuración de un scope
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = (searchParams.get("scope") || "global") as Scope;
    const scopeId = searchParams.get("scopeId");

    const deleted = await prisma.affinityConfig.deleteMany({
      where: {
        scope,
        scopeId: scope === "global" ? null : scopeId,
      },
    });

    return NextResponse.json({
      ok: true,
      deleted: deleted.count,
      message: `Config deleted for ${scope}${scopeId ? `:${scopeId}` : ""}`,
    });
  } catch (error) {
    console.error("[AffinityConfig DELETE] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Resolver configuración con herencia
 * Busca desde el scope más específico hasta el global,
 * mezclando configuraciones parciales
 */
async function resolveConfigWithInheritance(
  scope: Scope,
  scopeId: string | null
): Promise<{
  config: typeof DEFAULT_CONFIG;
  source: Record<string, string>;
  inheritance: Array<{ scope: string; scopeId: string | null; found: boolean }>;
}> {
  const inheritance: Array<{ scope: string; scopeId: string | null; found: boolean }> = [];
  const source: Record<string, string> = {};

  // Empezar con defaults
  let resolvedConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  source.contextWeights = "default";
  source.learningParams = "default";
  source.bandThresholds = "default";
  source.closenessMultipliers = "default";

  // Obtener IDs de la jerarquía según el scope inicial
  const scopeIds = await getScopeHierarchyIds(scope, scopeId);

  // Iterar desde global hasta el scope más específico
  // (así las configuraciones más específicas sobrescriben a las generales)
  const orderedScopes = [...SCOPE_HIERARCHY].reverse();

  for (const currentScope of orderedScopes) {
    const currentScopeId = scopeIds[currentScope];

    // Saltar si no tenemos ID para este scope (excepto global)
    if (currentScope !== "global" && !currentScopeId) {
      inheritance.push({ scope: currentScope, scopeId: null, found: false });
      continue;
    }

    const config = await prisma.affinityConfig.findFirst({
      where: {
        scope: currentScope,
        scopeId: currentScope === "global" ? null : currentScopeId,
        isActive: true,
      },
    });

    inheritance.push({
      scope: currentScope,
      scopeId: currentScopeId || null,
      found: !!config,
    });

    if (config) {
      // Mezclar configuración
      if (config.contextWeights && Object.keys(config.contextWeights as object).length > 0) {
        resolvedConfig.contextWeights = {
          ...resolvedConfig.contextWeights,
          ...(config.contextWeights as object),
        };
        source.contextWeights = `${currentScope}${currentScopeId ? `:${currentScopeId}` : ""}`;
      }

      if (config.learningParams && Object.keys(config.learningParams as object).length > 0) {
        resolvedConfig.learningParams = {
          ...resolvedConfig.learningParams,
          ...(config.learningParams as object),
        };
        source.learningParams = `${currentScope}${currentScopeId ? `:${currentScopeId}` : ""}`;
      }

      if (config.bandThresholds && Object.keys(config.bandThresholds as object).length > 0) {
        resolvedConfig.bandThresholds = {
          ...resolvedConfig.bandThresholds,
          ...(config.bandThresholds as object),
        };
        source.bandThresholds = `${currentScope}${currentScopeId ? `:${currentScopeId}` : ""}`;
      }

      if (config.closenessMultipliers && Object.keys(config.closenessMultipliers as object).length > 0) {
        resolvedConfig.closenessMultipliers = {
          ...resolvedConfig.closenessMultipliers,
          ...(config.closenessMultipliers as object),
        };
        source.closenessMultipliers = `${currentScope}${currentScopeId ? `:${currentScopeId}` : ""}`;
      }
    }
  }

  return { config: resolvedConfig, source, inheritance };
}

/**
 * Obtener IDs de la jerarquía de scopes a partir de un scope específico
 */
async function getScopeHierarchyIds(
  scope: Scope,
  scopeId: string | null
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
        // Team es una organización con unitType=TEAM
        const team = await prisma.organization.findUnique({
          where: { id: scopeId },
          select: { id: true, hubId: true, hub: { select: { tenantId: true } } },
        });
        if (team) {
          ids.team = team.id;
          ids.hub = team.hubId;
          ids.tenant = team.hub?.tenantId || null;
        }
        break;

      case "organization":
        const org = await prisma.organization.findUnique({
          where: { id: scopeId },
          select: { id: true, hubId: true, hub: { select: { tenantId: true } } },
        });
        if (org) {
          ids.organization = org.id;
          ids.hub = org.hubId;
          ids.tenant = org.hub?.tenantId || null;
        }
        break;

      case "hub":
        const hub = await prisma.hub.findUnique({
          where: { id: scopeId },
          select: { id: true, tenantId: true },
        });
        if (hub) {
          ids.hub = hub.id;
          ids.tenant = hub.tenantId;
        }
        break;

      case "tenant":
        ids.tenant = scopeId;
        break;
    }
  } catch (error) {
    console.error("[getScopeHierarchyIds] Error:", error);
  }

  return ids;
}
