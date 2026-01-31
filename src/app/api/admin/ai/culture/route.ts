/**
 * =============================================================
 * AI Culture Config API - Configuración cultural por niveles
 * =============================================================
 *
 * GET    - Obtener configuración cultural (con herencia)
 * POST   - Crear/actualizar configuración cultural
 * DELETE - Eliminar configuración cultural de un scope
 *
 * El contexto cultural permite que los agentes adapten su
 * comunicación según la misión, visión, valores y tono
 * de cada organización/hub/tenant.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

type Scope = "global" | "tenant" | "hub" | "organization" | "team";

const SCOPE_HIERARCHY: Scope[] = ["team", "organization", "hub", "tenant", "global"];

const DEFAULT_CULTURE = {
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
 * GET - Obtener configuración cultural
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

    // Buscar configuración específica del scope
    const config = await prisma.aiCultureConfig.findFirst({
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
        defaults: DEFAULT_CULTURE,
        message: `No config found for ${scope}${scopeId ? `:${scopeId}` : ""}`,
      });
    }

    return NextResponse.json({
      ok: true,
      config: {
        id: config.id,
        scope: config.scope,
        scopeId: config.scopeId,
        mission: config.mission,
        vision: config.vision,
        values: config.values,
        tone: config.tone,
        keywords: config.keywords,
        guidelines: config.guidelines,
        restrictions: config.restrictions,
        language: config.language,
        industry: config.industry,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      },
    });
  } catch (error) {
    console.error("[AICultureConfig GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Crear o actualizar configuración cultural
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
      mission,
      vision,
      values,
      tone,
      keywords,
      guidelines,
      restrictions,
      language,
      industry,
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

    // Preparar datos
    const configData: any = {
      scope,
      scopeId: scope === "global" ? null : scopeId,
      createdBy: user.id,
    };

    if (mission !== undefined) configData.mission = mission;
    if (vision !== undefined) configData.vision = vision;
    if (values !== undefined) configData.values = values;
    if (tone !== undefined) configData.tone = tone;
    if (keywords !== undefined) configData.keywords = keywords;
    if (guidelines !== undefined) configData.guidelines = guidelines;
    if (restrictions !== undefined) configData.restrictions = restrictions;
    if (language !== undefined) configData.language = language;
    if (industry !== undefined) configData.industry = industry;

    // Agregar relaciones según el scope
    if (scope === "tenant" && scopeId) {
      configData.tenantId = scopeId;
    } else if (scope === "hub" && scopeId) {
      configData.hubId = scopeId;
    } else if ((scope === "organization" || scope === "team") && scopeId) {
      configData.organizationId = scopeId;
    }

    // Upsert
    const config = await prisma.aiCultureConfig.upsert({
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
      message: `Culture config saved for ${scope}${scopeId ? `:${scopeId}` : ""}`,
    });
  } catch (error) {
    console.error("[AICultureConfig POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Eliminar configuración cultural
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

    const deleted = await prisma.aiCultureConfig.deleteMany({
      where: {
        scope,
        scopeId: scope === "global" ? null : scopeId,
      },
    });

    return NextResponse.json({
      ok: true,
      deleted: deleted.count,
      message: `Culture config deleted for ${scope}${scopeId ? `:${scopeId}` : ""}`,
    });
  } catch (error) {
    console.error("[AICultureConfig DELETE] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Resolver configuración con herencia
 */
async function resolveConfigWithInheritance(
  scope: Scope,
  scopeId: string | null
): Promise<{
  config: typeof DEFAULT_CULTURE;
  source: Record<string, string>;
  inheritance: Array<{ scope: string; scopeId: string | null; found: boolean }>;
}> {
  const inheritance: Array<{ scope: string; scopeId: string | null; found: boolean }> = [];
  const source: Record<string, string> = {};

  let resolvedConfig = JSON.parse(JSON.stringify(DEFAULT_CULTURE));
  Object.keys(DEFAULT_CULTURE).forEach((key) => {
    source[key] = "default";
  });

  const scopeIds = await getScopeHierarchyIds(scope, scopeId);
  const orderedScopes = [...SCOPE_HIERARCHY].reverse();

  for (const currentScope of orderedScopes) {
    const currentScopeId = scopeIds[currentScope];

    if (currentScope !== "global" && !currentScopeId) {
      inheritance.push({ scope: currentScope, scopeId: null, found: false });
      continue;
    }

    const config = await prisma.aiCultureConfig.findFirst({
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
      const scopeLabel = `${currentScope}${currentScopeId ? `:${currentScopeId}` : ""}`;

      if (config.mission) {
        resolvedConfig.mission = config.mission;
        source.mission = scopeLabel;
      }
      if (config.vision) {
        resolvedConfig.vision = config.vision;
        source.vision = scopeLabel;
      }
      if (config.values && (config.values as string[]).length > 0) {
        resolvedConfig.values = config.values;
        source.values = scopeLabel;
      }
      if (config.tone) {
        resolvedConfig.tone = config.tone;
        source.tone = scopeLabel;
      }
      if (config.keywords && (config.keywords as string[]).length > 0) {
        resolvedConfig.keywords = config.keywords;
        source.keywords = scopeLabel;
      }
      if (config.guidelines) {
        resolvedConfig.guidelines = config.guidelines;
        source.guidelines = scopeLabel;
      }
      if (config.restrictions) {
        resolvedConfig.restrictions = config.restrictions;
        source.restrictions = scopeLabel;
      }
      if (config.language) {
        resolvedConfig.language = config.language;
        source.language = scopeLabel;
      }
      if (config.industry) {
        resolvedConfig.industry = config.industry;
        source.industry = scopeLabel;
      }
    }
  }

  return { config: resolvedConfig, source, inheritance };
}

/**
 * Obtener IDs de la jerarquía de scopes
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
      case "organization":
        const org = await prisma.organization.findUnique({
          where: { id: scopeId },
          select: { id: true, hubId: true, hub: { select: { tenantId: true } } },
        });
        if (org) {
          if (scope === "team") {
            ids.team = org.id;
          } else {
            ids.organization = org.id;
          }
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
