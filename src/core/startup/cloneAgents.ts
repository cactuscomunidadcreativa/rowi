// src/core/startup/cloneAgents.ts
import { prisma } from "../prisma";

/**
 * 📦 Clona todos los agentes globales a un Tenant / SuperHub / Org específico.
 */
export async function cloneAgentsForContext({
  tenantId = null,
  superHubId = null,
  organizationId = null,
}: {
  tenantId?: string | null;
  superHubId?: string | null;
  organizationId?: string | null;
}) {
  try {
    const globals = await prisma.agentConfig.findMany({
      where: {
        tenantId: null,
        superHubId: null,
        organizationId: null,
      },
    });

    if (globals.length === 0) {
      console.warn("⚠️ No hay agentes globales para clonar.");
      return;
    }

    for (const g of globals) {
      const existing = await prisma.agentConfig.findFirst({
        where: {
          slug: g.slug,
          tenantId,
          superHubId,
          organizationId,
        },
      });

      if (!existing) {
        await prisma.agentConfig.create({
          data: {
            slug: g.slug,
            name: g.name,
            description: g.description,
            avatar: g.avatar,
            type: g.type,
            model: g.model,
            prompt: g.prompt,
            tools: (g.tools as any) ?? undefined,
            tone: g.tone,
            accessLevel: g.accessLevel,
            visibility: g.visibility,
            autoLearn: g.autoLearn,
            isActive: true,
            tenantId,
            superHubId,
            organizationId,
          },
        });
        console.log(`✅ Clonado agente ${g.slug} para ${tenantId || superHubId || organizationId}`);
      }
    }

    console.log("🤖 Clonación de agentes completada ✅");
  } catch (err) {
    console.error("❌ Error clonando agentes:", err);
  }
}