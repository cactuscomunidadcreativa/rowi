/**
 * 📊 API: Correlations
 * GET /api/admin/benchmarks/[id]/correlations - Correlaciones competencia→outcome
 */

import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;
    const { searchParams } = new URL(req.url);

    // Filtros opcionales
    const outcomeKey = searchParams.get("outcomeKey");
    const competencyKey = searchParams.get("competencyKey");
    const country = searchParams.get("country");
    const region = searchParams.get("region");
    const sector = searchParams.get("sector");
    const tenantId = searchParams.get("tenantId");
    const minStrength = searchParams.get("minStrength"); // strong, moderate, weak

    // Construir filtros
    const where: any = { benchmarkId: id };
    if (outcomeKey) where.outcomeKey = outcomeKey;
    if (competencyKey) where.competencyKey = competencyKey;
    if (country) where.country = country;
    if (region) where.region = region;
    if (sector) where.sector = sector;
    if (tenantId) where.tenantId = tenantId;

    if (minStrength) {
      const strengthOrder = ["strong", "moderate", "weak"];
      const minIndex = strengthOrder.indexOf(minStrength);
      if (minIndex >= 0) {
        where.strength = { in: strengthOrder.slice(0, minIndex + 1) };
      }
    }

    const correlations = await prisma.benchmarkCorrelation.findMany({
      where,
      orderBy: [
        { outcomeKey: "asc" },
        { correlation: "desc" },
      ],
    });

    // Agrupar por outcome para facilitar visualización
    const grouped: Record<string, typeof correlations> = {};
    for (const corr of correlations) {
      if (!grouped[corr.outcomeKey]) {
        grouped[corr.outcomeKey] = [];
      }
      grouped[corr.outcomeKey].push(corr);
    }

    // Ordenar cada grupo por correlación absoluta
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
    }

    return NextResponse.json({
      ok: true,
      correlations,
      grouped,
      total: correlations.length,
    });
  } catch (error) {
    console.error("❌ Error fetching correlations:", error);
    return NextResponse.json(
      { error: "Error al obtener correlaciones" },
      { status: 500 }
    );
  }
}
