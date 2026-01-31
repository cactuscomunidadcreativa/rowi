/**
 * 📊 API: Calculate Correlations
 * POST /api/admin/benchmarks/[id]/correlations/calculate
 *
 * Calcula correlaciones entre competencias EQ y outcomes para un benchmark.
 * Usa MUESTREO ESTADÍSTICO para datasets grandes (>20k registros).
 * Con 15k muestras tenemos 99% confianza y <1% margen de error.
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
const MAX_SAMPLE_SIZE = 15000; // 15k muestras = 99% confianza
const MIN_DATA_POINTS = 10;

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
 * Obtiene una muestra aleatoria de IDs usando SQL
 */
async function getRandomSampleIds(
  benchmarkId: string,
  whereFilter: any,
  sampleSize: number
): Promise<string[]> {
  // Contar total primero
  const totalCount = await prisma.benchmarkDataPoint.count({
    where: whereFilter,
  });

  if (totalCount <= sampleSize) {
    // Si hay menos registros que el tamaño de muestra, obtener todos los IDs
    const allRecords = await prisma.benchmarkDataPoint.findMany({
      where: whereFilter,
      select: { id: true },
    });
    return allRecords.map(r => r.id);
  }

  // Para datasets grandes, usar skip aleatorio para muestreo
  const ids: string[] = [];
  const skipInterval = Math.floor(totalCount / sampleSize);

  // Obtener IDs distribuidos uniformemente
  for (let i = 0; i < sampleSize && i * skipInterval < totalCount; i++) {
    const skip = i * skipInterval + Math.floor(Math.random() * skipInterval);
    const record = await prisma.benchmarkDataPoint.findFirst({
      where: whereFilter,
      select: { id: true },
      skip: Math.min(skip, totalCount - 1),
    });
    if (record) {
      ids.push(record.id);
    }
  }

  return ids;
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

    // Construir filtro para data points
    const whereFilter: any = { benchmarkId };
    if (country) whereFilter.country = country;
    if (region) whereFilter.region = region;
    if (sector) whereFilter.sector = sector;
    if (tenantId) whereFilter.tenantId = tenantId;

    // Contar total de registros
    const totalCount = await prisma.benchmarkDataPoint.count({
      where: whereFilter,
    });

    console.log(`📊 Total data points: ${totalCount}`);

    if (totalCount < MIN_DATA_POINTS) {
      return NextResponse.json({
        ok: false,
        error: "Not enough data points for correlation analysis (minimum 10)",
        count: totalCount,
      }, { status: 400 });
    }

    // Determinar si usar muestreo
    const useSampling = totalCount > MAX_SAMPLE_SIZE;
    const sampleSize = useSampling ? MAX_SAMPLE_SIZE : totalCount;

    console.log(`📊 Using ${useSampling ? 'SAMPLING' : 'full dataset'}: ${sampleSize} records`);

    // Obtener datos (con muestreo si es necesario)
    let dataPoints: any[];

    if (useSampling) {
      // Obtener muestra aleatoria usando chunks para no sobrecargar memoria
      const chunkSize = 5000;
      const chunks = Math.ceil(sampleSize / chunkSize);
      dataPoints = [];

      for (let chunk = 0; chunk < chunks; chunk++) {
        const skip = chunk * chunkSize;
        const take = Math.min(chunkSize, sampleSize - skip);

        // Usar orderBy random-ish con skip distribuido
        const skipAmount = Math.floor((totalCount / sampleSize) * skip);

        const chunkData = await prisma.benchmarkDataPoint.findMany({
          where: whereFilter,
          select: {
            K: true, C: true, G: true,
            EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true,
            effectiveness: true, relationships: true, qualityOfLife: true, wellbeing: true,
            influence: true, decisionMaking: true, community: true, network: true,
            achievement: true, satisfaction: true, balance: true, health: true,
          },
          skip: skipAmount,
          take: take,
        });

        dataPoints.push(...chunkData);
        console.log(`📊 Loaded chunk ${chunk + 1}/${chunks}: ${chunkData.length} records`);
      }
    } else {
      // Dataset pequeño, cargar todo
      dataPoints = await prisma.benchmarkDataPoint.findMany({
        where: whereFilter,
        select: {
          K: true, C: true, G: true,
          EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true,
          effectiveness: true, relationships: true, qualityOfLife: true, wellbeing: true,
          influence: true, decisionMaking: true, community: true, network: true,
          achievement: true, satisfaction: true, balance: true, health: true,
        },
      });
    }

    console.log(`📊 Loaded ${dataPoints.length} data points for analysis`);

    // Calcular correlaciones para cada competencia × outcome
    const correlations: any[] = [];
    let calculated = 0;

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
      totalDataPoints: totalCount,
      sampledDataPoints: dataPoints.length,
      usedSampling: useSampling,
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
