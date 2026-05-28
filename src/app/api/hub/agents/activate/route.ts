// src/app/api/hub/agents/activate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { PLATFORM_AGENT_SLUGS } from "@/lib/agents/platform";

export const runtime = "nodejs";

/**
 * 🔥 Activa o clona agentes base (globales) dentro de un contexto (Tenant, SuperHub, Org)
 * 
 * Body esperado:
 * {
 *   "agentSlug"?: "rowi-eco" | null,   // opcional, activa uno solo
 *   "scope": "tenant" | "superhub" | "org",
 *   "scopeId": "id-del-contexto"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { agentSlug, scope, scopeId } = await req.json();

    if (!scope || !scopeId)
      return NextResponse.json(
        { ok: false, error: "Faltan parámetros (scope, scopeId)" },
        { status: 400 }
      );

    // 🔍 Obtener todos los agentes globales base
    const whereGlobal = agentSlug
      ? { slug: agentSlug, tenantId: null, superHubId: null, organizationId: null }
      : { tenantId: null, superHubId: null, organizationId: null };

    const globalsAll = await prisma.agentConfig.findMany({ where: whereGlobal });
    // Agentes de plataforma (research) no se distribuyen: quedan solo en global.
    const globals = globalsAll.filter((g) => !PLATFORM_AGENT_SLUGS.has(g.slug));
    if (globals.length === 0)
      return NextResponse.json({ ok: false, error: "No se encontraron agentes globales" }, { status: 404 });

    let countCreated = 0;
    for (const base of globals) {
      // Crear contexto dinámico
      const context: any = {};
      if (scope === "tenant") context.tenantId = scopeId;
      if (scope === "superhub") context.superHubId = scopeId;
      if (scope === "org") context.organizationId = scopeId;

      const existing = await prisma.agentConfig.findFirst({
        where: { slug: base.slug, ...context },
      });

      if (!existing) {
        await prisma.agentConfig.create({
          data: {
            slug: base.slug,
            name: base.name,
            description: base.description,
            model: base.model,
            type: base.type,
            tone: base.tone,
            prompt: base.prompt,
            accessLevel: "private",
            visibility: "inherited",
            isActive: false,
            baseAgentId: base.id,
            ...context,
          },
        });
        countCreated++;
      }
    }

    return NextResponse.json({
      ok: true,
      created: countCreated,
      message: `🔄 ${countCreated} agentes sincronizados en ${scope}`,
    });
  } catch (error: any) {
    console.error("❌ Error en POST /api/hub/agents/activate:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}