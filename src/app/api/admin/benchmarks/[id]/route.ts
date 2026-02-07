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
    // Allow auth via session or x-user-email header
    const session = await getServerSession(authOptions);
    const headerEmail = req.headers.get("x-user-email");

    if (!session?.user?.email && !headerEmail) {
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
    const [countryStats, regionStats, sectorStats, jobFunctionStats, jobRoleStats, ageRangeStats, genderStats, educationStats, countryRegionStats] = await Promise.all([
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
      // Mapeo país → región
      prisma.benchmarkDataPoint.groupBy({
        by: ["country", "region"],
        where: { benchmarkId: id, country: { not: null }, region: { not: null } },
        _count: true,
      }),
    ]);

    // Obtener años y meses únicos
    let yearStats: Array<{ year: number | null; _count: number }> = [];
    let monthStats: Array<{ month: number | null; _count: number }> = [];
    let quarterStats: Array<{ quarter: number | null; _count: number }> = [];
    try {
      [yearStats, monthStats, quarterStats] = await Promise.all([
        prisma.benchmarkDataPoint.groupBy({
          by: ["year"],
          where: { benchmarkId: id, year: { not: null } },
          _count: true,
        }),
        prisma.benchmarkDataPoint.groupBy({
          by: ["month"],
          where: { benchmarkId: id, month: { not: null } },
          _count: true,
        }),
        prisma.benchmarkDataPoint.groupBy({
          by: ["quarter"],
          where: { benchmarkId: id, quarter: { not: null } },
          _count: true,
        }),
      ]);
    } catch (yearError) {
      console.error("❌ Error fetching temporal stats:", yearError);
    }

    // Formatear filtros para el frontend (excluir valores vacíos)
    const formatFilterOptions = (stats: any[], field: string) =>
      stats
        .filter((s) => s[field] && String(s[field]).trim() !== "") // Excluir null y strings vacíos
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

    // Formatear años desde el campo year (Int)
    const formatYearOptions = (stats: Array<{ year: number | null; _count: number }>) =>
      stats
        .filter((s) => s.year !== null && s.year > 1900 && s.year < 2100)
        .map((s) => ({
          value: String(s.year),
          label: String(s.year),
          count: s._count,
        }))
        .sort((a, b) => parseInt(b.value) - parseInt(a.value));

    // Nombres de meses en español
    const MONTH_NAMES: Record<number, string> = {
      1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
      5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
      9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre",
    };

    // Formatear meses
    const formatMonthOptions = (stats: Array<{ month: number | null; _count: number }>) =>
      stats
        .filter((s) => s.month !== null && s.month >= 1 && s.month <= 12)
        .map((s) => ({
          value: String(s.month),
          label: MONTH_NAMES[s.month!] || `Mes ${s.month}`,
          count: s._count,
        }))
        .sort((a, b) => parseInt(a.value) - parseInt(b.value)); // Ordenar Ene-Dic

    // Nombres de trimestres
    const QUARTER_NAMES: Record<number, string> = {
      1: "Q1 (Ene-Mar)", 2: "Q2 (Abr-Jun)",
      3: "Q3 (Jul-Sep)", 4: "Q4 (Oct-Dic)",
    };

    // Formatear trimestres
    const formatQuarterOptions = (stats: Array<{ quarter: number | null; _count: number }>) =>
      stats
        .filter((s) => s.quarter !== null && s.quarter >= 1 && s.quarter <= 4)
        .map((s) => ({
          value: String(s.quarter),
          label: QUARTER_NAMES[s.quarter!] || `Q${s.quarter}`,
          count: s._count,
        }))
        .sort((a, b) => parseInt(a.value) - parseInt(b.value));

    // Crear mapeo país → región (para filtrado dinámico en frontend)
    const countryToRegion: Record<string, string> = {};
    for (const stat of countryRegionStats) {
      if (stat.country && stat.region) {
        // Si un país tiene múltiples regiones, usar la región con más registros
        if (!countryToRegion[stat.country] || stat._count > (countryRegionStats.find(s => s.country === stat.country && s.region === countryToRegion[stat.country])?._count || 0)) {
          countryToRegion[stat.country] = stat.region;
        }
      }
    }

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
        months: formatMonthOptions(monthStats),
        quarters: formatQuarterOptions(quarterStats),
        // Mapeos para filtrado dinámico
        countryToRegion,
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
