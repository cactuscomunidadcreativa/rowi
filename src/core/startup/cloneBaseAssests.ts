import { prisma } from "../prisma";

/**
 * 🧬 Clona roles base y agentes IA globales
 * y los asigna al nuevo Hub, Tenant o SuperHub.
 */
export async function cloneBaseAssets({
  targetType,
  targetId,
}: {
  targetType: "hub" | "tenant" | "superhub";
  targetId: string;
}) {
  console.log(`🚀 Clonando configuraciones base para ${targetType}: ${targetId}`);

  try {
    // 1️⃣ Clonar Roles Base (solo si el tipo es Hub)
    if (targetType === "hub") {
      const baseRoles = await prisma.hubRoleDynamic.findMany({
        where: { hubId: undefined },
      });

      if (baseRoles.length > 0) {
        console.log(`🧩 Clonando ${baseRoles.length} roles base...`);
        await prisma.hubRoleDynamic.createMany({
          data: baseRoles.map((r) => ({
            hubId: targetId,
            name: r.name,
            permissions: r.permissions as any,
            color: r.color,
            icon: r.icon,
          })),
        });
      } else {
        console.log("⚠️ No hay roles base para clonar.");
      }
    }

    // 2️⃣ Clonar Agentes Base
    const baseAgents = await prisma.agentConfig.findMany({
      where: {
        tenantId: null,
        superHubId: null,
        organizationId: null,
      },
    });

    if (baseAgents.length > 0) {
      console.log(`🤖 Clonando ${baseAgents.length} agentes base...`);

      for (const agent of baseAgents) {
        await prisma.agentConfig.create({
          data: {
            slug: agent.slug,
            name: agent.name,
            description: agent.description,
            type: agent.type,
            model: agent.model,
            prompt: agent.prompt,
            tone: agent.tone,
            accessLevel: "superhub",
            visibility: "public",
            isActive: true,
            superHubId: targetType === "superhub" ? targetId : null,
            tenantId: targetType === "tenant" ? targetId : null,
          },
        });
      }

      console.log(`✅ Agentes clonados para ${targetType}: ${targetId}`);
    } else {
      console.log("⚠️ No hay agentes base globales para clonar.");
    }

    return { ok: true, message: "Configuraciones base clonadas exitosamente ✅" };
  } catch (error) {
    console.error("❌ Error al clonar configuraciones base:", error);
    return { ok: false, error: "Error al clonar configuraciones base" };
  }
}