import { prisma } from "../prisma";
import { PLATFORM_AGENT_SLUGS } from "@/lib/agents/platform";

export async function assignAgentsToEntity(
  scope: "tenant" | "superhub" | "hub" | "organization",
  entityId: string
) {
  try {
    console.log(`🔄 Vinculando IA → ${scope} (${entityId})`);

    const globalsAll = await prisma.agentConfig.findMany({
      where: {
        tenantId: null,
        superHubId: null,
        hubId: null,
        organizationId: null,
      },
    });

    // Los agentes de plataforma (p.ej. research) NO se distribuyen: quedan global.
    const globals = globalsAll.filter((a) => !PLATFORM_AGENT_SLUGS.has(a.slug));

    if (!globals.length) {
      console.warn("⚠️ No hay agentes globales distribuibles. Ejecuta ensureBaseAgents.");
      return;
    }

    for (const agent of globals) {
      const exists = await prisma.agentConfig.findFirst({
        where: {
          slug: agent.slug,
          ...(scope === "tenant" && { tenantId: entityId }),
          ...(scope === "superhub" && { superHubId: entityId }),
          ...(scope === "hub" && { hubId: entityId }),
          ...(scope === "organization" && { organizationId: entityId }),
        },
      });

      if (exists) {
        console.log(`⚙️ Ya existe → ${agent.slug} @ ${scope}`);
        continue;
      }

      await prisma.agentConfig.create({
        data: {
          slug: agent.slug,
          name: agent.name,
          description: agent.description,
          type: agent.type,
          model: agent.model,
          prompt: agent.prompt,
          tone: agent.tone,
          tools: (agent.tools as any) ?? undefined,
          visibility: agent.visibility,
          accessLevel: agent.accessLevel,
          autoLearn: agent.autoLearn,
          isActive: true,

          tenantId: scope === "tenant" ? entityId : null,
          superHubId: scope === "superhub" ? entityId : null,
          hubId: scope === "hub" ? entityId : null,
          organizationId: scope === "organization" ? entityId : null,
        },
      });

      console.log(`🟢 Clonado → ${agent.slug} → ${scope} (${entityId})`);
    }

    console.log(`✅ IA vinculada correctamente a ${scope}\n`);
  } catch (err) {
    console.error(`❌ Error vinculando IA (${scope}):`, err);
  }
}