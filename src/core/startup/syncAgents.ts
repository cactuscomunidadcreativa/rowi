// src/core/startup/syncAgents.ts
import { prisma } from "@/core/prisma";
import { assignAgentsToEntity } from "./assignAgents";

export async function syncAllAgentsEverywhere() {
  try {
    console.log("🔄 Iniciando sincronización global de agentes IA...");

    const agents = await prisma.agentConfig.findMany({
      where: { isActive: true },
    });

    if (agents.length === 0) {
      console.warn("⚠️ No hay agentes activos para sincronizar.");
      return;
    }

    const superhubs = await prisma.superHub.findMany();
    const hubs = await prisma.hub.findMany();
    const tenants = await prisma.tenant.findMany();
    const orgs = await prisma.organization.findMany();

    // 🌍 Vincular a Global
    await assignAgentsToEntity("global", "global");

    for (const sh of superhubs) {
      await assignAgentsToEntity("superhub", sh.id);
    }

    for (const h of hubs) {
      await assignAgentsToEntity("hub", h.id);
    }

    for (const t of tenants) {
      await assignAgentsToEntity("tenant", t.id);
    }

    for (const o of orgs) {
      await assignAgentsToEntity("organization", o.id);
    }

    console.log("🤖 IA sincronizada con TODO el ecosistema — COMPLETADO ✔️");
  } catch (error) {
    console.error("❌ Error en syncAllAgentsEverywhere:", error);
  }
}