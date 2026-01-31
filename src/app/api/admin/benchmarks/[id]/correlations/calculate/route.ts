/**
 * 📊 API: Calculate Correlations
 * POST /api/admin/benchmarks/[id]/correlations/calculate
 *
 * Calcula correlaciones entre competencias EQ y outcomes para un benchmark.
 * Opcionalmente filtra por país, región, sector.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";
import { EQ_COMPETENCIES, pearsonCorrelation } from "@/lib/benchmarks";

export const maxDuration = 300; // 5 minutos

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Todos los outcomes disponibles
const ALL_OUTCOMES = [
  "effectiveness",
  "relationships",
  "qualityOfLife",
  "wellbeing",
  "influence",
  "decisionMaking",
  "community",
  "network",
  "achievement",
  "satisfaction",
  "balance",
  "health",
];

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: benchmarkId } = await params;

    // Verificar que el benchmark existe
    const benchmark = await prisma.benchmark.findUnique({
      where: { id: benchmarkId },
    });

    if (!benchmark) {
      return NextResponse.json({ error: "Benchmark not found" }, { status: 404 });
    }

    // Obtener filtros opcionales del body
    const body = await req.json().catch(() => ({}));
    const { country, region, sector, tenantId, outcomes } = body;

    // Usar todos los outcomes o solo los especificados
    const outcomesToCalculate = outcomes?.length ? outcomes : ALL_OUTCOMES;

    console.log(`📊 Calculating correlations for benchmark ${benchmarkId}`);
    console.log(`📊 Outcomes: ${outcomesToCalculate.join(", ")}`);
    console.log(`📊 Filters: country=${country}, region=${region}, sector=${sector}`);

    // Construir filtro para data points
    const whereFilter: any = { benchmarkId };
    if (country) whereFilter.country = country;
    if (region) whereFilter.region = region;
    if (sector) whereFilter.sector = sector;
    if (tenantId) whereFilter.tenantId = tenantId;

    // Obtener todos los data points que coincidan con el filtro
    const dataPoints = await prisma.benchmarkDataPoint.findMany({
      where: whereFilter,
      select: {
        K: true,
        C: true,
        G: true,
        EL: true,
        RP: true,
        ACT: true,
        NE: true,
        IM: true,
        OP: true,
        EMP: true,
        NG: true,
        effectiveness: true,
        relationships: true,
        qualityOfLife: true,
        wellbeing: true,
        influence: true,
        decisionMaking: true,
        community: true,
        network: true,
        achievement: true,
        satisfaction: true,
        balance: true,
        health: true,
      },
    });

    console.log(`📊 Found ${dataPoints.length} data points`);

    if (dataPoints.length < 10) {
      return NextResponse.json({
        ok: false,
        error: "Not enough data points for correlation analysis (minimum 10)",
        count: dataPoints.length,
      }, { status: 400 });
    }

    // Calcular correlaciones para cada competencia × outcome
    const correlations: any[] = [];
    let calculated = 0;

    for (const competency of EQ_COMPETENCIES) {
      const competencyValues = dataPoints
        .map((dp: any) => dp[competency])
        .filter((v): v is number => typeof v === "number");

      for (const outcome of outcomesToCalculate) {
        const outcomeValues = dataPoints
          .map((dp: any) => dp[outcome])
          .filter((v): v is number => typeof v === "number");

        // Necesitamos pares con ambos valores
        const pairs: { comp: number; out: number }[] = [];
        for (let i = 0; i < dataPoints.length; i++) {
          const dp: any = dataPoints[i];
          if (typeof dp[competency] === "number" && typeof dp[outcome] === "number") {
            pairs.push({ comp: dp[competency], out: dp[outcome] });
          }
        }

        if (pairs.length >= 10) {
          const result = pearsonCorrelation(
            pairs.map((p) => p.comp),
            pairs.map((p) => p.out)
          );

          correlations.push({
            id: `${benchmarkId}_${competency}_${outcome}_${country || "all"}_${region || "all"}_${sector || "all"}`,
            benchmarkId,
            country: country || null,
            region: region || null,
            sector: sector || null,
            tenantId: tenantId || null,
            competencyKey: competency,
            outcomeKey: outcome,
            correlation: result.correlation,
            pValue: result.pValue,
            n: result.n,
            strength: result.strength,
            direction: result.direction,
            calculatedAt: new Date(),
          });
          calculated++;
        }
      }
    }

    console.log(`📊 Calculated ${calculated} correlations`);

    // Eliminar correlaciones existentes con los mismos filtros
    await prisma.benchmarkCorrelation.deleteMany({
      where: {
        benchmarkId,
        country: country || null,
        region: region || null,
        sector: sector || null,
        tenantId: tenantId || null,
      },
    });

    // Insertar nuevas correlaciones
    if (correlations.length > 0) {
      await prisma.benchmarkCorrelation.createMany({
        data: correlations,
        skipDuplicates: true,
      });
    }

    console.log(`✅ Saved ${correlations.length} correlations`);

    // Obtener top correlaciones para mostrar
    const topCorrelations = correlations
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
      .slice(0, 20);

    return NextResponse.json({
      ok: true,
      message: `Calculated ${correlations.length} correlations`,
      count: correlations.length,
      dataPoints: dataPoints.length,
      topCorrelations,
    });
  } catch (error) {
    console.error("❌ Error calculating correlations:", error);
    return NextResponse.json(
      { error: "Error calculating correlations", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
