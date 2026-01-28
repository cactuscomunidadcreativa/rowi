import { prisma } from "@/core/prisma";

export async function assignAgentsToEntity(
  level: "global" | "superhub" | "hub" | "tenant" | "organization",
  entityId: string
) {
  try {
    // obtener todos los agentes activos
    const agents = await prisma.agentConfig.findMany({
      where: { isActive: true },
    });

    const updates = agents.map((agent) => {
      return prisma.agentContext.upsert({
        where: {
          agentId_contextType_contextId: {
            agentId: agent.id,
            contextType: level,
            contextId: entityId,
          },
        },
        update: {},
        create: {
          agentId: agent.id,
          contextType: level,
          contextId: entityId,
        },
      });
    });

    await Promise.all(updates);
    console.log(`✅ IA vinculada automáticamente a ${level} (${entityId})`);
  } catch (err: any) {
    console.error(`❌ Error vinculando IA a ${level}:`, err);
  }
}
