/**
 * =============================================================
 * 🎯 Affinity Config List API - Listar todas las configuraciones
 * =============================================================
 *
 * GET - Listar todas las configuraciones de affinity (para admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    // Construir query
    const where: any = { isActive: true };

    // Filtrar por tenant si se especifica
    if (tenantId) {
      where.OR = [
        { scope: "global" },
        { tenantId },
        { hub: { tenantId } },
        { organization: { hub: { tenantId } } },
      ];
    }

    const configs = await prisma.affinityConfig.findMany({
      where,
      orderBy: [
        { scope: "asc" },
        { updatedAt: "desc" },
      ],
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        hub: { select: { id: true, name: true, slug: true } },
        organization: { select: { id: true, name: true, slug: true } },
      },
    });

    // Agrupar por scope
    const grouped = {
      global: configs.filter((c) => c.scope === "global"),
      tenant: configs.filter((c) => c.scope === "tenant"),
      hub: configs.filter((c) => c.scope === "hub"),
      organization: configs.filter((c) => c.scope === "organization"),
      team: configs.filter((c) => c.scope === "team"),
    };

    return NextResponse.json({
      ok: true,
      total: configs.length,
      configs,
      grouped,
    });
  } catch (error) {
    console.error("[AffinityConfig List] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
