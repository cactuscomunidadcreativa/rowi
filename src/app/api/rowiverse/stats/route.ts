/**
 * 🌐 API: RowiVerse Stats
 * GET /api/rowiverse/stats - Obtener estadísticas del RowiVerse global
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  getRowiverseStats,
  getUserContributions,
  getTenantContributions,
  getOrCreateRowiverseBenchmark,
} from "@/lib/rowiverse/contribution-service";
import { prisma } from "@/core/prisma";

// =========================================================
// GET - Obtener estadísticas del RowiVerse
// =========================================================
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const tenantId = searchParams.get("tenantId");

    // Si se pide por usuario específico
    if (userId) {
      const contributions = await getUserContributions(userId);
      return NextResponse.json({
        ok: true,
        contributions,
        totalContributions: contributions.length,
      });
    }

    // Si se pide por tenant específico
    if (tenantId) {
      const result = await getTenantContributions(tenantId);
      return NextResponse.json({
        ok: true,
        ...result,
      });
    }

    // Estadísticas globales
    const [stats, benchmarkId] = await Promise.all([
      getRowiverseStats(),
      getOrCreateRowiverseBenchmark(),
    ]);

    // Obtener info del benchmark
    const benchmark = await prisma.benchmark.findUnique({
      where: { id: benchmarkId },
      select: {
        id: true,
        name: true,
        totalRows: true,
        processedRows: true,
        lastEnrichedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      benchmark,
      stats,
    });
  } catch (error) {
    console.error("❌ Error fetching RowiVerse stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
