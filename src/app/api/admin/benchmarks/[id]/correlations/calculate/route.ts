/**
 * 📊 API: Calculate Correlations
 * POST /api/admin/benchmarks/[id]/correlations/calculate
 *
 * Calcula correlaciones entre métricas y outcomes para un benchmark.
 *
 * Dimensiones:
 * 1. EQ Competencias individuales (8) + Pursuits (K,C,G) → Outcomes
 * 2. Brain Talents individuales (18) → Outcomes
 * 3. Grupos agregados: categorías de talentos + orientaciones → Outcomes
 *
 * - Calcula correlaciones GLOBALES (todos los años)
 * - Calcula correlaciones POR AÑO (para comparar evolución)
 * - Usa MUESTREO ESTADÍSTICO para datasets grandes (>10k registros por grupo)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";
import { EQ_COMPETENCIES, BRAIN_TALENTS, pearsonCorrelation } from "@/lib/benchmarks";

export const maxDuration = 300; // 5 minutos

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Configuración de muestreo
const MAX_SAMPLE_SIZE = 10000;
const MIN_DATA_POINTS = 30;

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

// =========================================================
// Definiciones de grupos para correlaciones agregadas
// Basadas en las definiciones de dictionary.ts y column-mapping.ts
// =========================================================

const CORRELATION_GROUPS: { key: string; fields: string[] }[] = [
  // Brain Talent Categories (3 grandes áreas)
  { key: "grp:focus", fields: ["dataMining", "modeling", "prioritizing", "connection", "emotionalInsight", "collaboration"] },
  { key: "grp:decisions", fields: ["reflecting", "adaptability", "criticalThinking", "resilience", "riskTolerance", "imagination"] },
  { key: "grp:drive", fields: ["proactivity", "commitment", "problemSolving", "vision", "designing", "entrepreneurship"] },
  // Brain Talent Orientations (6 sub-áreas)
  { key: "grp:focus_data", fields: ["dataMining", "modeling", "prioritizing"] },
  { key: "grp:focus_people", fields: ["connection", "emotionalInsight", "collaboration"] },
  { key: "grp:decisions_evaluative", fields: ["reflecting", "adaptability", "criticalThinking"] },
  { key: "grp:decisions_innovative", fields: ["resilience", "riskTolerance", "imagination"] },
  { key: "grp:drive_practical", fields: ["proactivity", "commitment", "problemSolving"] },
  { key: "grp:drive_idealistic", fields: ["vision", "designing", "entrepreneurship"] },
];

// Select completo: EQ + Outcomes + Brain Talents
const DATA_POINT_SELECT = {
  year: true,
  // EQ Pursuits + Competencies
  K: true, C: true, G: true,
  EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true,
  // Outcomes
  effectiveness: true, relationships: true, qualityOfLife: true, wellbeing: true,
  influence: true, decisionMaking: true, community: true, network: true,
  achievement: true, satisfaction: true, balance: true, health: true,
  // Brain Talents (18)
  dataMining: true, modeling: true, prioritizing: true,
  connection: true, emotionalInsight: true, collaboration: true,
  reflecting: true, adaptability: true, criticalThinking: true,
  resilience: true, riskTolerance: true, imagination: true,
  proactivity: true, commitment: true, problemSolving: true,
  vision: true, designing: true, entrepreneurship: true,
};

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
    const data = await prisma.benchmarkDataPoint.findMany({
      where: whereFilter,
      select: DATA_POINT_SELECT,
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
      select: DATA_POINT_SELECT,
      skip: skipAmount,
      take: take,
    });

    data.push(...chunkData);
  }

  return { data, total: totalCount, sampled: true };
}

/**
 * Calcula correlaciones individuales: cada métrica vs cada outcome
 */
function calculateIndividualCorrelations(
  dataPoints: any[],
  benchmarkId: string,
  metricKeys: string[],
  outcomesToCalculate: string[],
  filters: { country?: string; region?: string; sector?: string; year?: number; tenantId?: string }
): any[] {
  const correlations: any[] = [];
  const { country, region, sector, year, tenantId } = filters;

  for (const metric of metricKeys) {
    for (const outcome of outcomesToCalculate) {
      const pairs: { comp: number; out: number }[] = [];
      for (const dp of dataPoints) {
        if (typeof dp[metric] === "number" && typeof dp[outcome] === "number") {
          pairs.push({ comp: dp[metric], out: dp[outcome] });
        }
      }

      if (pairs.length >= MIN_DATA_POINTS) {
        const result = pearsonCorrelation(
          pairs.map((p) => p.comp),
          pairs.map((p) => p.out)
        );

        const yearStr = year ? String(year) : "all";
        correlations.push({
          id: `${benchmarkId}_${metric}_${outcome}_${country || "all"}_${region || "all"}_${sector || "all"}_${yearStr}`,
          benchmarkId,
          country: country || null,
          region: region || null,
          sector: sector || null,
          year: year || null,
          tenantId: tenantId || null,
          competencyKey: metric,
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

/**
 * Calcula correlaciones agrupadas: promedio de campos del grupo vs outcome
 */
function calculateGroupedCorrelations(
  dataPoints: any[],
  benchmarkId: string,
  groups: { key: string; fields: string[] }[],
  outcomesToCalculate: string[],
  filters: { country?: string; region?: string; sector?: string; year?: number; tenantId?: string }
): any[] {
  const correlations: any[] = [];
  const { country, region, sector, year, tenantId } = filters;

  for (const group of groups) {
    for (const outcome of outcomesToCalculate) {
      const pairs: { comp: number; out: number }[] = [];

      for (const dp of dataPoints) {
        const outcomeVal = dp[outcome];
        if (typeof outcomeVal !== "number") continue;

        // Promediar los campos del grupo (solo los que tienen valor)
        const values = group.fields
          .map((f) => dp[f])
          .filter((v): v is number => typeof v === "number");

        if (values.length === 0) continue;

        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        pairs.push({ comp: avg, out: outcomeVal });
      }

      if (pairs.length >= MIN_DATA_POINTS) {
        const result = pearsonCorrelation(
          pairs.map((p) => p.comp),
          pairs.map((p) => p.out)
        );

        const yearStr = year ? String(year) : "all";
        correlations.push({
          id: `${benchmarkId}_${group.key}_${outcome}_${country || "all"}_${region || "all"}_${sector || "all"}_${yearStr}`,
          benchmarkId,
          country: country || null,
          region: region || null,
          sector: sector || null,
          year: year || null,
          tenantId: tenantId || null,
          competencyKey: group.key,
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

    const benchmark = await prisma.benchmark.findUnique({
      where: { id: benchmarkId },
    });

    if (!benchmark) {
      return NextResponse.json({ error: "Benchmark not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { country, region, sector, tenantId, outcomes } = body;

    const outcomesToCalculate = outcomes?.length ? outcomes : ALL_OUTCOMES;

    console.log(`📊 Calculating correlations for benchmark ${benchmarkId}`);
    console.log(`📊 Outcomes: ${outcomesToCalculate.join(", ")}`);

    const baseFilter: any = { benchmarkId };
    if (country) baseFilter.country = country;
    if (region) baseFilter.region = region;
    if (sector) baseFilter.sector = sector;
    if (tenantId) baseFilter.tenantId = tenantId;

    // =========================================================
    // 1. Obtener años disponibles
    // =========================================================
    const yearsData = await prisma.benchmarkDataPoint.groupBy({
      by: ["year"],
      where: { ...baseFilter, year: { not: null } },
      _count: { year: true },
    });

    const availableYears = yearsData
      .filter((y) => y.year !== null && y._count.year >= MIN_DATA_POINTS)
      .map((y) => y.year as number)
      .sort((a, b) => a - b);

    console.log(`📊 Available years: ${availableYears.join(", ")}`);

    // =========================================================
    // 2. Calcular correlaciones GLOBALES
    // =========================================================
    console.log(`📊 Calculating GLOBAL correlations...`);

    const { data: globalData, total: globalTotal, sampled: globalSampled } =
      await getDataWithSampling(baseFilter, MAX_SAMPLE_SIZE);

    console.log(`📊 Global: ${globalData.length} data points (total: ${globalTotal}, sampled: ${globalSampled})`);

    const filters = { country, region, sector, tenantId, year: undefined as number | undefined };

    // 2a. EQ Competencias individuales → Outcomes
    const eqCorrelations = calculateIndividualCorrelations(
      globalData, benchmarkId, EQ_COMPETENCIES, outcomesToCalculate, filters
    );
    console.log(`📊 EQ individual correlations: ${eqCorrelations.length}`);

    // 2b. Brain Talents individuales → Outcomes
    const talentCorrelations = calculateIndividualCorrelations(
      globalData, benchmarkId, BRAIN_TALENTS, outcomesToCalculate, filters
    );
    console.log(`📊 Brain talent correlations: ${talentCorrelations.length}`);

    // 2c. Grupos agregados → Outcomes
    const groupedCorrelations = calculateGroupedCorrelations(
      globalData, benchmarkId, CORRELATION_GROUPS, outcomesToCalculate, filters
    );
    console.log(`📊 Grouped correlations: ${groupedCorrelations.length}`);

    const globalCorrelations = [...eqCorrelations, ...talentCorrelations, ...groupedCorrelations];
    console.log(`📊 Total global correlations: ${globalCorrelations.length}`);

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

        const yFilters = { country, region, sector, tenantId, year };

        const yEQ = calculateIndividualCorrelations(
          yearData, benchmarkId, EQ_COMPETENCIES, outcomesToCalculate, yFilters
        );
        const yTalents = calculateIndividualCorrelations(
          yearData, benchmarkId, BRAIN_TALENTS, outcomesToCalculate, yFilters
        );
        const yGrouped = calculateGroupedCorrelations(
          yearData, benchmarkId, CORRELATION_GROUPS, outcomesToCalculate, yFilters
        );

        const yAll = [...yEQ, ...yTalents, ...yGrouped];
        yearCorrelations.push(...yAll);
        console.log(`📊 Year ${year}: ${yAll.length} correlations`);
      } else {
        console.log(`⚠️ Year ${year}: Not enough data (${yearData.length} < ${MIN_DATA_POINTS})`);
      }
    }

    // =========================================================
    // 4. Combinar y guardar
    // =========================================================
    const allCorrelations = [...globalCorrelations, ...yearCorrelations];

    console.log(`📊 Total correlations: ${allCorrelations.length} (global: ${globalCorrelations.length}, by year: ${yearCorrelations.length})`);

    // Eliminar correlaciones existentes
    await prisma.benchmarkCorrelation.deleteMany({
      where: {
        benchmarkId,
        country: country || null,
        region: region || null,
        sector: sector || null,
        tenantId: tenantId || null,
      },
    });

    // Insertar en batches de 500
    if (allCorrelations.length > 0) {
      const BATCH = 500;
      for (let i = 0; i < allCorrelations.length; i += BATCH) {
        const batch = allCorrelations.slice(i, i + BATCH);
        await prisma.benchmarkCorrelation.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }
    }

    console.log(`✅ Saved ${allCorrelations.length} correlations`);

    // =========================================================
    // 5. Preparar respuesta
    // =========================================================
    const topGlobalCorrelations = globalCorrelations
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
      .slice(0, 10);

    const yearSummary = availableYears.map((year) => {
      const yearCorrs = yearCorrelations.filter((c) => c.year === year);
      const avgCorr =
        yearCorrs.length > 0
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
        eqCorrelations: eqCorrelations.length,
        talentCorrelations: talentCorrelations.length,
        groupedCorrelations: groupedCorrelations.length,
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
