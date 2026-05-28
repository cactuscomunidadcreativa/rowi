// src/core/startup/cloneAgents.ts
import { prisma } from "../prisma";
import { PLATFORM_AGENT_SLUGS } from "@/lib/agents/platform";

/**
 * 📦 Clona los agentes globales DISTRIBUIBLES a un Tenant / SuperHub / Hub / Org.
 * Agentes de plataforma (p.ej. research) NO se clonan: quedan solo en global.
 * Idempotente (dedup slug + scope). Best-effort: nunca lanza.
 */
export async function cloneAgentsForContext({
  tenantId = null,
  superHubId = null,
  hubId = null,
  organizationId = null,
}: {
  tenantId?: string | null;
  superHubId?: string | null;
  hubId?: string | null;
  organizationId?: string | null;
}) {
  try {
    const globalsAll = await prisma.agentConfig.findMany({
      where: { tenantId: null, superHubId: null, hubId: null, organizationId: null },
    });
    const globals = globalsAll.filter((g) => !PLATFORM_AGENT_SLUGS.has(g.slug));

    if (globals.length === 0) {
      console.warn("⚠️ No hay agentes globales distribuibles para clonar.");
      return;
    }

    for (const g of globals) {
      const existing = await prisma.agentConfig.findFirst({
        where: { slug: g.slug, tenantId, superHubId, hubId, organizationId },
      });
      if (existing) continue;

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
          hubId,
          organizationId,
        },
      });
    }

    console.log("🤖 Clonación de agentes completada ✅");
  } catch (err) {
    console.error("❌ Error clonando agentes:", err);
  }
}
