/**
 * 📊 API: Benchmark Individual
 * GET /api/admin/benchmarks/[id] - Obtener benchmark
 * PATCH /api/admin/benchmarks/[id] - Actualizar benchmark
 * DELETE /api/admin/benchmarks/[id] - Eliminar benchmark
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// =========================================================
// GET - Obtener benchmark por ID
// =========================================================
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const benchmark = await prisma.benchmark.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, name: true } },
        hub: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true } },
        _count: {
          select: {
            dataPoints: true,
            statistics: true,
            correlations: true,
            topPerformers: true,
            outcomePatterns: true,
            userComparisons: true,
          },
        },
      },
    });

    if (!benchmark) {
      return NextResponse.json(
        { error: "Benchmark no encontrado" },
        { status: 404 }
      );
    }

    // Obtener valores únicos para filtros
    const [countryStats, regionStats, sectorStats, jobFunctionStats, jobRoleStats, ageRangeStats, genderStats, educationStats] = await Promise.all([
      prisma.benchmarkDataPoint.groupBy({
        by: ["country"],
        where: { benchmarkId: id, country: { not: null } },
        _count: true,
      }),
      prisma.benchmarkDataPoint.groupBy({
        by: ["region"],
        where: { benchmarkId: id, region: { not: null } },
        _count: true,
      }),
      prisma.benchmarkDataPoint.groupBy({
        by: ["sector"],
        where: { benchmarkId: id, sector: { not: null } },
        _count: true,
      }),
      prisma.benchmarkDataPoint.groupBy({
        by: ["jobFunction"],
        where: { benchmarkId: id, jobFunction: { not: null } },
        _count: true,
      }),
      prisma.benchmarkDataPoint.groupBy({
        by: ["jobRole"],
        where: { benchmarkId: id, jobRole: { not: null } },
        _count: true,
      }),
      prisma.benchmarkDataPoint.groupBy({
        by: ["ageRange"],
        where: { benchmarkId: id, ageRange: { not: null } },
        _count: true,
      }),
      prisma.benchmarkDataPoint.groupBy({
        by: ["gender"],
        where: { benchmarkId: id, gender: { not: null } },
        _count: true,
      }),
      prisma.benchmarkDataPoint.groupBy({
        by: ["education"],
        where: { benchmarkId: id, education: { not: null } },
        _count: true,
      }),
    ]);

    // Obtener años únicos de sourceDate (en query separado por si falla)
    let yearStats: Array<{ year: number; count: bigint }> = [];
    try {
      yearStats = await prisma.$queryRaw<Array<{ year: number; count: bigint }>>`
        SELECT EXTRACT(YEAR FROM "sourceDate")::int as year, COUNT(*) as count
        FROM "BenchmarkDataPoint"
        WHERE "benchmarkId" = ${id} AND "sourceDate" IS NOT NULL
        GROUP BY year
        ORDER BY year DESC
      `;
    } catch (yearError) {
      console.log("Note: Could not fetch year stats (sourceDate may be empty):", yearError);
    }

    // Formatear filtros para el frontend (excluir valores vacíos)
    const formatFilterOptions = (stats: any[], field: string) =>
      stats
        .filter((s) => s[field] && s[field].trim() !== "") // Excluir null y strings vacíos
        .map((s) => ({
          value: s[field],
          label: s[field],
          count: s._count,
        }))
        .sort((a, b) => b.count - a.count);

    // Agrupar edades en bloques de 5 años
    const groupAgeRangesIn5YearBlocks = (ageStats: any[]) => {
      const ageBlocks: Record<string, number> = {};

      for (const stat of ageStats) {
        if (!stat.ageRange) continue;

        // Intentar extraer un número de la edad
        const ageMatch = stat.ageRange.match(/(\d+)/);
        if (ageMatch) {
          const age = parseInt(ageMatch[1], 10);
          // Agrupar en bloques de 5 años: 20-24, 25-29, 30-34, etc.
          const blockStart = Math.floor(age / 5) * 5;
          const blockEnd = blockStart + 4;
          const blockKey = `${blockStart}-${blockEnd}`;
          ageBlocks[blockKey] = (ageBlocks[blockKey] || 0) + stat._count;
        } else {
          // Si no podemos parsear, mantener el valor original
          ageBlocks[stat.ageRange] = (ageBlocks[stat.ageRange] || 0) + stat._count;
        }
      }

      // Convertir a formato de opciones de filtro
      return Object.entries(ageBlocks)
        .map(([range, count]) => ({
          value: range,
          label: `${range} años`,
          count,
        }))
        .sort((a, b) => {
          // Ordenar por edad (extraer primer número)
          const aNum = parseInt(a.value.match(/(\d+)/)?.[1] || "0", 10);
          const bNum = parseInt(b.value.match(/(\d+)/)?.[1] || "0", 10);
          return aNum - bNum;
        });
    };

    // Formatear años
    const formatYearOptions = (stats: Array<{ year: number; count: bigint }>) =>
      stats
        .filter((s) => s.year && s.year > 1900)
        .map((s) => ({
          value: String(s.year),
          label: String(s.year),
          count: Number(s.count),
        }))
        .sort((a, b) => parseInt(b.value) - parseInt(a.value)); // Más reciente primero

    return NextResponse.json({
      ok: true,
      benchmark: {
        ...benchmark,
        countries: formatFilterOptions(countryStats, "country"),
        regions: formatFilterOptions(regionStats, "region"),
        sectors: formatFilterOptions(sectorStats, "sector"),
        jobFunctions: formatFilterOptions(jobFunctionStats, "jobFunction"),
        jobRoles: formatFilterOptions(jobRoleStats, "jobRole"),
        ageRanges: groupAgeRangesIn5YearBlocks(ageRangeStats),
        genders: formatFilterOptions(genderStats, "gender"),
        educations: formatFilterOptions(educationStats, "education"),
        years: formatYearOptions(yearStats),
      },
      metadata: {
        countries: countryStats.length,
        sectors: sectorStats.length,
        countryBreakdown: countryStats.slice(0, 10),
        sectorBreakdown: sectorStats.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching benchmark:", error);
    return NextResponse.json(
      { error: "Error al obtener benchmark" },
      { status: 500 }
    );
  }
}

// =========================================================
// PATCH - Actualizar benchmark
// =========================================================
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const { name, description, isActive, isLearning, status } = body;

    const benchmark = await prisma.benchmark.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(isLearning !== undefined && { isLearning }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json({
      ok: true,
      benchmark,
    });
  } catch (error) {
    console.error("❌ Error updating benchmark:", error);
    return NextResponse.json(
      { error: "Error al actualizar benchmark" },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE - Eliminar benchmark
// =========================================================
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que existe
    const benchmark = await prisma.benchmark.findUnique({
      where: { id },
    });

    if (!benchmark) {
      return NextResponse.json(
        { error: "Benchmark no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar (cascade eliminará dataPoints, statistics, etc.)
    await prisma.benchmark.delete({
      where: { id },
    });

    return NextResponse.json({
      ok: true,
      message: "Benchmark eliminado correctamente",
    });
  } catch (error) {
    console.error("❌ Error deleting benchmark:", error);
    return NextResponse.json(
      { error: "Error al eliminar benchmark" },
      { status: 500 }
    );
  }
}
