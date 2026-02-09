/**
 * 📊 API: Benchmark Data Points
 * GET /api/admin/benchmarks/[id]/data-points - Registros individuales
 * Devuelve data points con paginación, búsqueda y filtros
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const headerEmail = req.headers.get("x-user-email");

    if (!session?.user?.email && !headerEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);

    // Paginación
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Filtros
    const country = searchParams.get("country");
    const region = searchParams.get("region");
    const sector = searchParams.get("sector");
    const jobFunction = searchParams.get("jobFunction");
    const jobRole = searchParams.get("jobRole");
    const brainStyle = searchParams.get("brainStyle");
    const ageRange = searchParams.get("ageRange");
    const gender = searchParams.get("gender");
    const sourceId = searchParams.get("sourceId");

    const where: any = { benchmarkId: id };
    if (country) where.country = country;
    if (region) where.region = region;
    if (sector) where.sector = sector;
    if (jobFunction) where.jobFunction = jobFunction;
    if (jobRole) where.jobRole = jobRole;
    if (brainStyle) where.brainStyle = brainStyle;
    if (ageRange) where.ageRange = ageRange;
    if (gender) where.gender = gender;
    if (sourceId) where.sourceId = sourceId;

    // Asegurar que tienen eqTotal
    where.eqTotal = { not: null };

    const [dataPoints, total] = await Promise.all([
      prisma.benchmarkDataPoint.findMany({
        where,
        select: {
          id: true,
          sourceId: true,
          sourceDate: true,
          country: true,
          region: true,
          jobFunction: true,
          jobRole: true,
          sector: true,
          ageRange: true,
          gender: true,
          brainStyle: true,
          reliabilityIndex: true,
          // Core EQ
          K: true, C: true, G: true, eqTotal: true,
          // 8 Competencies
          EL: true, RP: true, ACT: true, NE: true,
          IM: true, OP: true, EMP: true, NG: true,
          // 4 Main Outcomes
          effectiveness: true, relationships: true,
          wellbeing: true, qualityOfLife: true,
          // Talents
          brainAgility: true,
        },
        orderBy: { eqTotal: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.benchmarkDataPoint.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      dataPoints,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("❌ Error fetching data points:", error);
    return NextResponse.json(
      { error: "Error al obtener data points" },
      { status: 500 }
    );
  }
}
