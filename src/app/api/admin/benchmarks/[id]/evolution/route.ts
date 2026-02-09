/**
 * 📊 API: Benchmark Evolution / Longitudinal Data
 * GET /api/admin/benchmarks/[id]/evolution
 * Busca sourceIds con múltiples assessments y devuelve su historial
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

    const sourceId = searchParams.get("sourceId");
    const minAssessments = parseInt(searchParams.get("minAssessments") || "2");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    if (sourceId) {
      // Fetch evolution for a specific person
      const assessments = await prisma.benchmarkDataPoint.findMany({
        where: { benchmarkId: id, sourceId },
        select: {
          id: true, sourceId: true, sourceDate: true,
          country: true, region: true, jobRole: true, brainStyle: true,
          K: true, C: true, G: true, eqTotal: true,
          EL: true, RP: true, ACT: true, NE: true,
          IM: true, OP: true, EMP: true, NG: true,
          effectiveness: true, relationships: true,
          wellbeing: true, qualityOfLife: true,
        },
        orderBy: { sourceDate: "asc" },
      });

      return NextResponse.json({
        ok: true,
        sourceId,
        assessmentCount: assessments.length,
        assessments,
      });
    }

    // Find all sourceIds with multiple assessments
    const duplicateSourceIds = await prisma.benchmarkDataPoint.groupBy({
      by: ["sourceId"],
      where: {
        benchmarkId: id,
        sourceId: { not: null },
        eqTotal: { not: null },
      },
      _count: { sourceId: true },
      having: { sourceId: { _count: { gte: minAssessments } } },
      orderBy: { _count: { sourceId: "desc" } },
      take: limit,
    });

    // Fetch details for each person with evolution
    const evolutions = [];
    for (const dup of duplicateSourceIds) {
      if (!dup.sourceId) continue;

      const assessments = await prisma.benchmarkDataPoint.findMany({
        where: { benchmarkId: id, sourceId: dup.sourceId },
        select: {
          id: true, sourceId: true, sourceDate: true,
          country: true, region: true, jobRole: true, brainStyle: true,
          K: true, C: true, G: true, eqTotal: true,
          EL: true, RP: true, ACT: true, NE: true,
          IM: true, OP: true, EMP: true, NG: true,
          effectiveness: true, relationships: true,
          wellbeing: true, qualityOfLife: true,
        },
        orderBy: { sourceDate: "asc" },
      });

      if (assessments.length < minAssessments) continue;

      // Calculate growth
      const first = assessments[0];
      const last = assessments[assessments.length - 1];
      const eqGrowth = (last.eqTotal ?? 0) - (first.eqTotal ?? 0);

      evolutions.push({
        sourceId: dup.sourceId,
        assessmentCount: assessments.length,
        country: last.country,
        region: last.region,
        jobRole: last.jobRole,
        brainStyle: last.brainStyle,
        firstEQ: first.eqTotal,
        lastEQ: last.eqTotal,
        eqGrowth: Math.round(eqGrowth * 100) / 100,
        firstDate: first.sourceDate,
        lastDate: last.sourceDate,
        assessments,
      });
    }

    // Sort by absolute growth
    evolutions.sort((a, b) => Math.abs(b.eqGrowth) - Math.abs(a.eqGrowth));

    return NextResponse.json({
      ok: true,
      totalWithEvolution: evolutions.length,
      evolutions,
    });
  } catch (error) {
    console.error("❌ Error fetching evolution data:", error);
    return NextResponse.json(
      { error: "Error al obtener datos de evolución" },
      { status: 500 }
    );
  }
}
