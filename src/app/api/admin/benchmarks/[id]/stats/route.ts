/**
 * 📊 API: Benchmark Statistics
 * GET /api/admin/benchmarks/[id]/stats - Estadísticas del benchmark
 * Calcula estadísticas en tiempo real cuando hay filtros
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Métricas disponibles para calcular
const ALL_METRICS = [
  "K", "C", "G", "eqTotal",
  "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG",
  "effectiveness", "relationships", "qualityOfLife", "wellbeing",
  "influence", "decisionMaking", "community", "network",
  "achievement", "satisfaction", "balance", "health",
  // 18 Brain Talents
  "dataMining", "modeling", "prioritizing", "connection", "emotionalInsight", "collaboration",
  "reflecting", "adaptability", "criticalThinking", "resilience", "riskTolerance", "imagination",
  "proactivity", "commitment", "problemSolving", "vision", "designing", "entrepreneurship",
];

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // Allow auth via session or x-user-email header
    const session = await getServerSession(authOptions);
    const headerEmail = req.headers.get("x-user-email");

    if (!session?.user?.email && !headerEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);

    // Filtros opcionales
    const country = searchParams.get("country");
    const region = searchParams.get("region");
    const sector = searchParams.get("sector");
    const jobFunction = searchParams.get("jobFunction");
    const jobRole = searchParams.get("jobRole");
    const ageRange = searchParams.get("ageRange");
    const gender = searchParams.get("gender");
    const education = searchParams.get("education");

    // Construir filtros para dataPoints
    const where: any = { benchmarkId: id };
    if (country) where.country = country;
    if (region) where.region = region;
    if (sector) where.sector = sector;
    if (jobFunction) where.jobFunction = jobFunction;
    if (jobRole) where.jobRole = jobRole;
    if (ageRange) where.ageRange = ageRange;
    if (gender) where.gender = gender;
    if (education) where.education = education;

    const hasFilters = country || region || sector || jobFunction || jobRole || ageRange || gender || education;

    let statistics;

    if (hasFilters) {
      // Calcular estadísticas en tiempo real desde dataPoints
      statistics = await calculateStatsFromDataPoints(where);
    } else {
      // Intentar usar estadísticas pre-calculadas
      statistics = await prisma.benchmarkStatistic.findMany({
        where: { benchmarkId: id },
        orderBy: { metricKey: "asc" },
      });

      // Si no hay estadísticas pre-calculadas, calcular en tiempo real
      if (statistics.length === 0) {
        console.log(`📊 No pre-calculated stats for benchmark ${id}, calculating on-the-fly...`);
        statistics = await calculateStatsFromDataPoints(where);
      }
    }

    return NextResponse.json({
      ok: true,
      statistics,
      total: statistics.length,
      filtered: hasFilters,
    });
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}

// Calcular estadísticas en tiempo real
async function calculateStatsFromDataPoints(where: any) {
  const statistics = [];

  for (const metric of ALL_METRICS) {
    // Obtener todos los valores para esta métrica
    const dataPoints = await prisma.benchmarkDataPoint.findMany({
      where: {
        ...where,
        [metric]: { not: null },
      },
      select: { [metric]: true },
    });

    const values = dataPoints
      .map((dp: any) => dp[metric])
      .filter((v: any) => v !== null && v !== undefined)
      .sort((a: number, b: number) => a - b);

    const n = values.length;
    if (n === 0) continue;

    // Calcular estadísticas
    const sum = values.reduce((a: number, b: number) => a + b, 0);
    const mean = sum / n;

    const variance = values.reduce((acc: number, val: number) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const getPercentile = (p: number) => {
      const idx = Math.floor((p / 100) * (n - 1));
      return values[idx];
    };

    statistics.push({
      metricKey: metric,
      n,
      mean,
      median: getPercentile(50),
      stdDev,
      min: values[0],
      max: values[n - 1],
      p10: getPercentile(10),
      p25: getPercentile(25),
      p50: getPercentile(50),
      p75: getPercentile(75),
      p90: getPercentile(90),
      p95: getPercentile(95),
    });
  }

  return statistics;
}
