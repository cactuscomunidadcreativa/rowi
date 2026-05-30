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
import {
  CULTURE_SCOPE_HIERARCHY,
  DEFAULT_CULTURE,
  resolveCultureWithInheritance,
  type CultureScope,
} from "@/lib/ai/cultureConfig";

type Scope = CultureScope;

const SCOPE_HIERARCHY = CULTURE_SCOPE_HIERARCHY;

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
      const config = await resolveCultureWithInheritance(scope, scopeId);
      return NextResponse.json({ ok: true, config });
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
