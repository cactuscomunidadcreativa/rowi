import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

/* =========================================================
   🔍 GET — Estadísticas de agentes activos por contexto
========================================================= */
export async function GET() {
  try {
    const [
      globalCount,
      tenantCount,
      superHubCount,
      hubCount,
      orgCount,
    ] = await Promise.all([
      prisma.agentContext.count({
        where: { contextType: "Global", isActive: true },
      }),
      prisma.agentContext.count({
        where: { contextType: "Tenant", isActive: true },
      }),
      prisma.agentContext.count({
        where: { contextType: "SuperHub", isActive: true },
      }),
      prisma.agentContext.count({
        where: { contextType: "Hub", isActive: true },
      }),
      prisma.agentContext.count({
        where: { contextType: "Organization", isActive: true },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      stats: {
        global: globalCount,
        tenants: tenantCount,
        superHubs: superHubCount,
        hubs: hubCount,
        orgs: orgCount,
        total:
          globalCount + tenantCount + superHubCount + hubCount + orgCount,
      },
    });
  } catch (err: any) {
    console.error("❌ Error GET /agents/stats:", err);
    return NextResponse.json(
      { ok: false, error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}