import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 🔹 Obtener Tenants con sus agentes y plan
    const tenants = await prisma.tenant.findMany({
      include: {
        agents: true,
        plan: { select: { id: true, name: true, priceUsd: true } },
        superHub: { select: { id: true, name: true } },
      },
    });

    // 🔹 Usuarios asociados a cada tenant por primaryTenantId
    const usersByTenant = await prisma.user.groupBy({
      by: ["primaryTenantId"],
      _count: { _all: true },
    });

    // 🔹 Tokens usados por tenant
    const tokenUsage = await prisma.userUsage.groupBy({
      by: ["tenantId"],
      _sum: { tokensInput: true, tokensOutput: true },
    });

    // 🔹 Fusionar todo
    const byTenant = tenants.map((t) => {
      const usage = tokenUsage.find((u) => u.tenantId === t.id);
      const tokensUsed =
        (usage?._sum.tokensInput || 0) + (usage?._sum.tokensOutput || 0);

      const userGroup = usersByTenant.find((u) => u.primaryTenantId === t.id);
      const userCount = userGroup?._count._all || 0;

      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        plan: t.plan?.name || "Sin plan",
        superHub: t.superHub?.name || "—",
        totalAgents: t.agents.length,
        activeAgents: t.agents.filter((a) => a.isActive).length,
        inactiveAgents: t.agents.filter((a) => !a.isActive).length,
        users: userCount,
        tokensUsed,
      };
    });

    // 🔹 Totales globales
    const totals = {
      tenants: byTenant.length,
      totalAgents: byTenant.reduce((a, b) => a + b.totalAgents, 0),
      activeAgents: byTenant.reduce((a, b) => a + b.activeAgents, 0),
      tokensUsed: byTenant.reduce((a, b) => a + b.tokensUsed, 0),
      totalUsers: byTenant.reduce((a, b) => a + b.users, 0),
    };

    return NextResponse.json({ ok: true, byTenant, totals });
  } catch (err: any) {
    console.error("❌ Error en /api/admin/reports:", err);
    return NextResponse.json(
      { ok: false, error: "Error generando reportes" },
      { status: 500 }
    );
  }
}