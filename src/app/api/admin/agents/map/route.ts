import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

/**
 * GET /api/admin/agents/map?slug=eco
 * Devuelve mapa de instancias del agente por contexto
 * Formato esperado por el frontend:
 * { instances: [{ type: "Global"|"Tenant"|"Hub"|"SuperHub"|"Org", name: string, activeCount: number }] }
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug)
      return NextResponse.json(
        { ok: false, error: "Falta parámetro slug" },
        { status: 400 }
      );

    // Obtener todas las instancias del agente con ese slug
    const agents = await prisma.agentConfig.findMany({
      where: { slug },
      select: {
        id: true,
        isActive: true,
        accessLevel: true,
        tenantId: true,
        superHubId: true,
        organizationId: true,
        hubId: true,
        tenant: { select: { id: true, name: true } },
        superHub: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true } },
        hub: { select: { id: true, name: true } },
      },
    });

    // Agrupar por contexto
    const instances: { type: string; name: string; activeCount: number }[] = [];

    // Contar instancias globales
    const globalAgents = agents.filter(
      (a) => a.accessLevel === "global" || (!a.tenantId && !a.superHubId && !a.organizationId && !a.hubId)
    );
    if (globalAgents.length > 0) {
      instances.push({
        type: "Global",
        name: "Sistema Base",
        activeCount: globalAgents.filter((a) => a.isActive).length,
      });
    }

    // Agrupar por tenant
    const tenantMap = new Map<string, { name: string; active: number; total: number }>();
    agents.filter((a) => a.tenantId && a.tenant).forEach((a) => {
      const key = a.tenantId!;
      const existing = tenantMap.get(key) || { name: a.tenant!.name, active: 0, total: 0 };
      existing.total++;
      if (a.isActive) existing.active++;
      tenantMap.set(key, existing);
    });
    tenantMap.forEach((v) => {
      instances.push({ type: "Tenant", name: v.name, activeCount: v.active });
    });

    // Agrupar por superHub
    const superHubMap = new Map<string, { name: string; active: number }>();
    agents.filter((a) => a.superHubId && a.superHub).forEach((a) => {
      const key = a.superHubId!;
      const existing = superHubMap.get(key) || { name: a.superHub!.name, active: 0 };
      if (a.isActive) existing.active++;
      superHubMap.set(key, existing);
    });
    superHubMap.forEach((v) => {
      instances.push({ type: "SuperHub", name: v.name, activeCount: v.active });
    });

    // Agrupar por organization
    const orgMap = new Map<string, { name: string; active: number }>();
    agents.filter((a) => a.organizationId && a.organization).forEach((a) => {
      const key = a.organizationId!;
      const existing = orgMap.get(key) || { name: a.organization!.name, active: 0 };
      if (a.isActive) existing.active++;
      orgMap.set(key, existing);
    });
    orgMap.forEach((v) => {
      instances.push({ type: "Org", name: v.name, activeCount: v.active });
    });

    // Agrupar por hub
    const hubMap = new Map<string, { name: string; active: number }>();
    agents.filter((a) => a.hubId && a.hub).forEach((a) => {
      const key = a.hubId!;
      const existing = hubMap.get(key) || { name: a.hub!.name, active: 0 };
      if (a.isActive) existing.active++;
      hubMap.set(key, existing);
    });
    hubMap.forEach((v) => {
      instances.push({ type: "Hub", name: v.name, activeCount: v.active });
    });

    return NextResponse.json(
      { ok: true, instances },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (error: any) {
    console.error("❌ Error GET /agents/map:", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener mapa de agentes" },
      { status: 500 }
    );
  }
}