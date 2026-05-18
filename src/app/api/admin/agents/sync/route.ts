// src/app/api/admin/agents/sync/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { assignAgentsToEntity } from "@/core/startup/assignAgentsToEntity";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/**
 * POST /api/admin/agents/sync
 * ---------------------------------------------------------
 * 1) Clona agentes GLOBAL → tenant / superhub / hub / org
 * 2) Evita duplicados (slug + contexto)
 * 3) No ejecuta assignAgentsToEntity dentro del bucle
 * 4) Llama assignAgentsToEntity SOLO UNA VEZ por contexto
 */
export async function POST() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    console.log("🔄 Iniciando sincronización completa de agentes IA...");

    /* =========================================================
       1️⃣ AGENTES GLOBAL BASE
    ========================================================== */
    const globalAgents = await prisma.agentConfig.findMany({
      where: {
        tenantId: null,
        superHubId: null,
        hubId: null,
        organizationId: null,
      },
    });

    if (globalAgents.length === 0) {
      return NextResponse.json({
        ok: false,
        message: "⚠️ No hay agentes globales. Ejecuta ensureBaseAgents()",
      });
    }

    /* =========================================================
       2️⃣ CONTEXTOS ACTIVOS
    ========================================================== */
    const [tenants, superHubs, hubs, orgs] = await Promise.all([
      prisma.tenant.findMany({ select: { id: true } }),
      prisma.superHub.findMany({ select: { id: true } }),
      prisma.hub.findMany({ select: { id: true } }),
      prisma.organization.findMany({ select: { id: true } }),
    ]);

    let created = 0;
    let skipped = 0;

    /* =========================================================
       🔵 FUNCIONES AUXILIARES
    ========================================================== */
    async function cloneToContext(context: string, id: string) {
      for (const base of globalAgents) {
        const exists = await prisma.agentConfig.findFirst({
          where: {
            slug: base.slug,
            ...(context === "tenant" && { tenantId: id }),
            ...(context === "superhub" && { superHubId: id }),
            ...(context === "hub" && { hubId: id }),
            ...(context === "organization" && { organizationId: id }),
          },
        });

        if (exists) {
          skipped++;
          continue;
        }

        await prisma.agentConfig.create({
          data: {
            slug: base.slug,
            name: base.name,
            description: base.description,
            type: base.type,
            model: base.model,
            prompt: base.prompt,
            // base.tools is Prisma JsonValue; pass through as the
            // input expects InputJsonValue. The ?? null normalizes
            // JSON `null` to DB null.
            tools: base.tools ?? undefined,
            tone: base.tone,
            accessLevel: base.accessLevel,
            visibility: base.visibility,
            autoLearn: base.autoLearn,
            isActive: true,

            tenantId: context === "tenant" ? id : null,
            superHubId: context === "superhub" ? id : null,
            hubId: context === "hub" ? id : null,
            organizationId: context === "organization" ? id : null,
          },
        });

        created++;
      }

      // SOLO DESPUÉS DE CLONAR TODO → activar
      await assignAgentsToEntity(context as any, id);
    }

    /* =========================================================
       🟦 CLONAR A TODOS LOS TENANTS
    ========================================================== */
    for (const t of tenants) {
      await cloneToContext("tenant", t.id);
    }

    /* =========================================================
       🟪 CLONAR A TODOS LOS SUPERHUBS
    ========================================================== */
    for (const s of superHubs) {
      await cloneToContext("superhub", s.id);
    }

    /* =========================================================
       🟨 CLONAR A TODOS LOS HUBS
    ========================================================== */
    for (const h of hubs) {
      await cloneToContext("hub", h.id);
    }

    /* =========================================================
       🟩 CLONAR A TODAS LAS ORGANIZACIONES
    ========================================================== */
    for (const o of orgs) {
      await cloneToContext("organization", o.id);
    }

    /* =========================================================
       🟢 RESPUESTA FINAL
    ========================================================== */
    return NextResponse.json({
      ok: true,
      message: "🤖 Sincronización de IA completada con éxito",
      created,
      skipped,
    });

  } catch (error: any) {
    console.error("❌ Error en /api/admin/agents/sync:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}