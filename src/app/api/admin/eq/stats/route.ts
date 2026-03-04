/**
 * =========================================================
 * 🧠 API: EQ Stats — Estadísticas globales de EQ
 * =========================================================
 * GET /api/admin/eq/stats
 *
 * Devuelve métricas agregadas de inteligencia emocional
 * de todos los usuarios del sistema ROWI
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

export const dynamic = "force-dynamic";

/**
 * Verifica si el usuario es administrador del sistema
 */
async function isSystemAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const hubAdmins = process.env.HUB_ADMINS || "";
  const adminEmails = hubAdmins.split(",").map(e => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  try {
    // 🔐 Verificar autenticación y permisos
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }
    if (!(await isSystemAdmin(session.user.email))) {
      return NextResponse.json({ ok: false, error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener total de snapshots
    const totalSnapshots = await prisma.eqSnapshot.count();

    // Obtener usuarios únicos con EQ
    const uniqueUsers = await prisma.eqSnapshot.groupBy({
      by: ["userId"],
      where: { userId: { not: null } },
    });
    const totalUsers = uniqueUsers.length;

    // Obtener promedios de K, C, G y overall4
    const avgScores = await prisma.eqSnapshot.aggregate({
      _avg: {
        K: true,
        C: true,
        G: true,
        overall4: true,
      },
    });

    // Snapshots recientes (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSnapshots = await prisma.eqSnapshot.count({
      where: { at: { gte: thirtyDaysAgo } },
    });

    // Top países
    const countryCounts = await prisma.eqSnapshot.groupBy({
      by: ["country"],
      _count: { country: true },
      orderBy: { _count: { country: "desc" } },
      take: 10,
    });

    const topCountries = countryCounts.map(c => ({
      country: c.country || "Unknown",
      count: c._count.country,
    }));

    // Promedios de competencias SEI (datos reales)
    const avgCompetencies = await prisma.eqSnapshot.aggregate({
      _avg: {
        EL: true,
        RP: true,
        ACT: true,
        NE: true,
        IM: true,
        OP: true,
        EMP: true,
        NG: true,
      },
    });

    const competencies = {
      EL: avgCompetencies._avg?.EL || 0,
      RP: avgCompetencies._avg?.RP || 0,
      ACT: avgCompetencies._avg?.ACT || 0,
      NE: avgCompetencies._avg?.NE || 0,
      IM: avgCompetencies._avg?.IM || 0,
      OP: avgCompetencies._avg?.OP || 0,
      EMP: avgCompetencies._avg?.EMP || 0,
      NG: avgCompetencies._avg?.NG || 0,
    };

    // Tendencia mensual (últimos 12 meses, datos reales)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlySnapshots = await prisma.$queryRaw<
      Array<{ month: string; avg: number }>
    >`
      SELECT
        TO_CHAR("at", 'YYYY-MM') AS month,
        ROUND(AVG("overall4")::numeric, 1) AS avg
      FROM "eq_snapshot"
      WHERE "at" >= ${twelveMonthsAgo}
        AND "overall4" IS NOT NULL
      GROUP BY TO_CHAR("at", 'YYYY-MM')
      ORDER BY month ASC
    `;

    const monthlyTrend = monthlySnapshots.map(m => ({
      month: m.month,
      avg: Number(m.avg) || 0,
    }));

    // Distribución de Brain Styles (datos reales)
    const brainStyleCounts = await prisma.eqSnapshot.groupBy({
      by: ["brainStyle"],
      _count: { brainStyle: true },
      where: { brainStyle: { not: null } },
      orderBy: { _count: { brainStyle: "desc" } },
    });

    const totalWithBrainStyle = brainStyleCounts.reduce((sum, b) => sum + b._count.brainStyle, 0);
    const brainStyles = brainStyleCounts.map(b => ({
      name: b.brainStyle || "Unknown",
      value: totalWithBrainStyle > 0
        ? Math.round((b._count.brainStyle / totalWithBrainStyle) * 100)
        : 0,
      count: b._count.brainStyle,
    }));

    // Snapshots recientes (últimos 10)
    const recentSnapshotsList = await prisma.eqSnapshot.findMany({
      take: 10,
      orderBy: { at: "desc" },
      select: {
        id: true,
        at: true,
        overall4: true,
        K: true,
        C: true,
        G: true,
        brainStyle: true,
        country: true,
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      stats: {
        totalSnapshots,
        totalUsers,
        avgKnow: avgScores._avg?.K || 0,
        avgChoose: avgScores._avg?.C || 0,
        avgGive: avgScores._avg?.G || 0,
        avgTotal: avgScores._avg?.overall4 || 0,
        recentSnapshots,
        topCountries,
        competencies,
        monthlyTrend,
        brainStyles,
        recentSnapshotsList,
      },
    });
  } catch (err: any) {
    console.error("❌ Error en GET /api/admin/eq/stats:", err);
    return NextResponse.json(
      { ok: false, error: "Error al obtener estadísticas: " + err.message },
      { status: 500 }
    );
  }
}
