/**
 * 📊 API: Calculate Correlations
 * POST /api/admin/benchmarks/[id]/correlations/calculate
 *
 * Calcula correlaciones entre competencias EQ y outcomes para un benchmark.
 * - Calcula correlaciones GLOBALES (todos los años)
 * - Calcula correlaciones POR AÑO (para comparar evolución)
 * - Usa MUESTREO ESTADÍSTICO para datasets grandes (>10k registros por grupo)
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

// Configuración de muestreo
const MAX_SAMPLE_SIZE = 10000; // 10k muestras por grupo = alta confianza
const MIN_DATA_POINTS = 30; // Mínimo para correlaciones válidas

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

/**
 * Obtiene datos con muestreo si es necesario
 */
async function getDataWithSampling(
  whereFilter: any,
  maxSample: number
): Promise<{ data: any[]; total: number; sampled: boolean }> {
  const totalCount = await prisma.benchmarkDataPoint.count({
    where: whereFilter,
  });

  if (totalCount <= maxSample) {
    // Dataset pequeño, cargar todo
    const data = await prisma.benchmarkDataPoint.findMany({
      where: whereFilter,
      select: {
        year: true,
        K: true, C: true, G: true,
        EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true,
        effectiveness: true, relationships: true, qualityOfLife: true, wellbeing: true,
        influence: true, decisionMaking: true, community: true, network: true,
        achievement: true, satisfaction: true, balance: true, health: true,
      },
    });
    return { data, total: totalCount, sampled: false };
  }

  // Dataset grande, usar muestreo por chunks
  const chunkSize = 5000;
  const chunks = Math.ceil(maxSample / chunkSize);
  const data: any[] = [];

  for (let chunk = 0; chunk < chunks; chunk++) {
    const skip = chunk * chunkSize;
    const take = Math.min(chunkSize, maxSample - skip);
    const skipAmount = Math.floor((totalCount / maxSample) * skip);

    const chunkData = await prisma.benchmarkDataPoint.findMany({
      where: whereFilter,
      select: {
        year: true,
        K: true, C: true, G: true,
        EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true,
        effectiveness: true, relationships: true, qualityOfLife: true, wellbeing: true,
        influence: true, decisionMaking: true, community: true, network: true,
        achievement: true, satisfaction: true, balance: true, health: true,
      },
      skip: skipAmount,
      take: take,
    });

    data.push(...chunkData);
  }

  return { data, total: totalCount, sampled: true };
}

/**
 * Calcula correlaciones para un conjunto de datos
 */
function calculateCorrelationsForData(
  dataPoints: any[],
  benchmarkId: string,
  outcomesToCalculate: string[],
  filters: { country?: string; region?: string; sector?: string; year?: number; tenantId?: string }
): any[] {
  const correlations: any[] = [];
  const { country, region, sector, year, tenantId } = filters;

  for (const competency of EQ_COMPETENCIES) {
    for (const outcome of outcomesToCalculate) {
      // Obtener pares válidos
      const pairs: { comp: number; out: number }[] = [];
      for (const dp of dataPoints) {
        if (typeof dp[competency] === "number" && typeof dp[outcome] === "number") {
          pairs.push({ comp: dp[competency], out: dp[outcome] });
        }
      }

      if (pairs.length >= MIN_DATA_POINTS) {
        const result = pearsonCorrelation(
          pairs.map((p) => p.comp),
          pairs.map((p) => p.out)
        );

        const yearStr = year ? String(year) : "all";
        correlations.push({
          id: `${benchmarkId}_${competency}_${outcome}_${country || "all"}_${region || "all"}_${sector || "all"}_${yearStr}`,
          benchmarkId,
          country: country || null,
          region: region || null,
          sector: sector || null,
          year: year || null,
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
      }
    }
  }

  return correlations;
}

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

    // Construir filtro base
    const baseFilter: any = { benchmarkId };
    if (country) baseFilter.country = country;
    if (region) baseFilter.region = region;
    if (sector) baseFilter.sector = sector;
    if (tenantId) baseFilter.tenantId = tenantId;

    // =========================================================
    // 1. Obtener años disponibles
    // =========================================================
    const yearsData = await prisma.benchmarkDataPoint.groupBy({
      by: ['year'],
      where: { ...baseFilter, year: { not: null } },
      _count: { year: true },
    });

    const availableYears = yearsData
      .filter(y => y.year !== null && y._count.year >= MIN_DATA_POINTS)
      .map(y => y.year as number)
      .sort((a, b) => a - b);

    console.log(`📊 Available years: ${availableYears.join(", ")}`);

    // =========================================================
    // 2. Calcular correlaciones GLOBALES (todos los años)
    // =========================================================
    console.log(`📊 Calculating GLOBAL correlations...`);

    const { data: globalData, total: globalTotal, sampled: globalSampled } =
      await getDataWithSampling(baseFilter, MAX_SAMPLE_SIZE);

    console.log(`📊 Global: ${globalData.length} data points (total: ${globalTotal}, sampled: ${globalSampled})`);

    const globalCorrelations = calculateCorrelationsForData(
      globalData,
      benchmarkId,
      outcomesToCalculate,
      { country, region, sector, tenantId, year: undefined }
    );

    console.log(`📊 Global correlations calculated: ${globalCorrelations.length}`);

    // =========================================================
    // 3. Calcular correlaciones POR AÑO
    // =========================================================
    const yearCorrelations: any[] = [];

    for (const year of availableYears) {
      console.log(`📊 Calculating correlations for year ${year}...`);

      const yearFilter = { ...baseFilter, year };
      const { data: yearData, total: yearTotal, sampled: yearSampled } =
        await getDataWithSampling(yearFilter, MAX_SAMPLE_SIZE);

      if (yearData.length >= MIN_DATA_POINTS) {
        console.log(`📊 Year ${year}: ${yearData.length} data points (total: ${yearTotal}, sampled: ${yearSampled})`);

        const correlations = calculateCorrelationsForData(
          yearData,
          benchmarkId,
          outcomesToCalculate,
          { country, region, sector, tenantId, year }
        );

        yearCorrelations.push(...correlations);
        console.log(`📊 Year ${year}: ${correlations.length} correlations`);
      } else {
        console.log(`⚠️ Year ${year}: Not enough data (${yearData.length} < ${MIN_DATA_POINTS})`);
      }
    }

    // =========================================================
    // 4. Combinar todas las correlaciones
    // =========================================================
    const allCorrelations = [...globalCorrelations, ...yearCorrelations];

    console.log(`📊 Total correlations: ${allCorrelations.length} (global: ${globalCorrelations.length}, by year: ${yearCorrelations.length})`);

    // =========================================================
    // 5. Guardar en base de datos
    // =========================================================

    // Eliminar correlaciones existentes con los mismos filtros base
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
    if (allCorrelations.length > 0) {
      await prisma.benchmarkCorrelation.createMany({
        data: allCorrelations,
        skipDuplicates: true,
      });
    }

    console.log(`✅ Saved ${allCorrelations.length} correlations`);

    // =========================================================
    // 6. Preparar respuesta
    // =========================================================

    // Top correlaciones globales
    const topGlobalCorrelations = globalCorrelations
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
      .slice(0, 10);

    // Resumen por año
    const yearSummary = availableYears.map(year => {
      const yearCorrs = yearCorrelations.filter(c => c.year === year);
      const avgCorr = yearCorrs.length > 0
        ? yearCorrs.reduce((sum, c) => sum + Math.abs(c.correlation), 0) / yearCorrs.length
        : 0;
      return {
        year,
        correlationsCount: yearCorrs.length,
        avgAbsCorrelation: avgCorr,
      };
    });

    return NextResponse.json({
      ok: true,
      message: `Calculated ${allCorrelations.length} correlations`,
      summary: {
        totalCorrelations: allCorrelations.length,
        globalCorrelations: globalCorrelations.length,
        yearCorrelations: yearCorrelations.length,
        totalDataPoints: globalTotal,
        sampledDataPoints: globalData.length,
        usedSampling: globalSampled,
        availableYears,
      },
      yearSummary,
      topGlobalCorrelations,
    });
  } catch (error) {
    console.error("❌ Error calculating correlations:", error);
    return NextResponse.json(
      { error: "Error calculating correlations", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
