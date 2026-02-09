/**
 * 📊 API: Benchmark Grouped Statistics
 * GET /api/admin/benchmarks/[id]/stats/grouped - Estadísticas agrupadas por campo
 * Agrupa por: region, country, jobRole, jobFunction, sector, brainStyle
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const METRICS = [
  "eqTotal", "K", "C", "G",
  "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG",
  "effectiveness", "relationships", "wellbeing", "qualityOfLife",
];

const VALID_GROUP_FIELDS = ["region", "country", "jobRole", "jobFunction", "sector", "brainStyle", "ageRange", "gender"];

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const headerEmail = req.headers.get("x-user-email");

    if (!session?.user?.email && !headerEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);

    const groupBy = searchParams.get("groupBy") || "region";
    if (!VALID_GROUP_FIELDS.includes(groupBy)) {
      return NextResponse.json(
        { error: `Invalid groupBy field. Valid: ${VALID_GROUP_FIELDS.join(", ")}` },
        { status: 400 }
      );
    }

    // Filtros adicionales
    const country = searchParams.get("country");
    const region = searchParams.get("region");
    const sector = searchParams.get("sector");
    const jobFunction = searchParams.get("jobFunction");

    const where: any = { benchmarkId: id, eqTotal: { not: null } };
    if (country) where.country = country;
    if (region && groupBy !== "region") where.region = region;
    if (sector && groupBy !== "sector") where.sector = sector;
    if (jobFunction && groupBy !== "jobFunction") where.jobFunction = jobFunction;

    // Obtener valores únicos del groupBy field
    const distinctValues = await prisma.benchmarkDataPoint.findMany({
      where: { ...where, [groupBy]: { not: null } },
      select: { [groupBy]: true },
      distinct: [groupBy as any],
    });

    const groupValues = distinctValues
      .map((d: any) => d[groupBy])
      .filter(Boolean)
      .sort();

    // Calcular estadísticas por grupo
    const groups = [];

    for (const groupValue of groupValues) {
      const groupWhere = { ...where, [groupBy]: groupValue };

      const dataPoints = await prisma.benchmarkDataPoint.findMany({
        where: groupWhere,
        select: Object.fromEntries(METRICS.map(m => [m, true])),
      });

      const count = dataPoints.length;
      if (count === 0) continue;

      const metrics: Record<string, { mean: number; median: number; min: number; max: number; stdDev: number }> = {};

      for (const metric of METRICS) {
        const values = dataPoints
          .map((dp: any) => dp[metric])
          .filter((v: any) => v !== null && v !== undefined)
          .sort((a: number, b: number) => a - b);

        const n = values.length;
        if (n === 0) continue;

        const sum = values.reduce((a: number, b: number) => a + b, 0);
        const mean = sum / n;
        const variance = values.reduce((acc: number, val: number) => acc + Math.pow(val - mean, 2), 0) / n;
        const medianIdx = Math.floor(n / 2);

        metrics[metric] = {
          mean: Math.round(mean * 100) / 100,
          median: Math.round(values[medianIdx] * 100) / 100,
          min: Math.round(values[0] * 100) / 100,
          max: Math.round(values[n - 1] * 100) / 100,
          stdDev: Math.round(Math.sqrt(variance) * 100) / 100,
        };
      }

      // Obtener distribución de brainStyle si es relevante
      let brainStyleDist: Record<string, number> | undefined;
      if (groupBy !== "brainStyle") {
        const brainStyles = await prisma.benchmarkDataPoint.groupBy({
          by: ["brainStyle"],
          where: { ...groupWhere, brainStyle: { not: null } },
          _count: { brainStyle: true },
        });
        brainStyleDist = {};
        for (const bs of brainStyles) {
          if (bs.brainStyle) brainStyleDist[bs.brainStyle] = bs._count.brainStyle;
        }
      }

      groups.push({
        name: groupValue,
        count,
        metrics,
        brainStyleDist,
      });
    }

    // Ordenar por count desc
    groups.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      ok: true,
      groupBy,
      groups,
      totalGroups: groups.length,
      totalRecords: groups.reduce((sum, g) => sum + g.count, 0),
    });
  } catch (error) {
    console.error("❌ Error fetching grouped stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas agrupadas" },
      { status: 500 }
    );
  }
}
