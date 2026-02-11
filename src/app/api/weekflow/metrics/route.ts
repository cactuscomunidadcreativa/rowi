import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

/**
 * GET /api/weekflow/metrics
 * Obtiene métricas de WeekFlow para un hub/tenant
 * Query params:
 *   - hubId: ID del hub (requerido)
 *   - period: WEEKLY, MONTHLY, QUARTERLY, YEARLY (default: WEEKLY)
 *   - userId: filtrar por usuario específico (opcional, solo admin)
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Plan check bypassed — WeekFlow open for all users

    const { searchParams } = new URL(req.url);
    const hubId = searchParams.get("hubId");
    const period = searchParams.get("period") || "WEEKLY";
    const userId = searchParams.get("userId");

    if (!hubId) {
      return NextResponse.json({ ok: false, error: "hubId required" }, { status: 400 });
    }

    // Calcular fechas según periodo
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "MONTHLY":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "QUARTERLY":
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case "YEARLY":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "WEEKLY":
      default: {
        // Inicio de la semana (lunes) - no mutar `now`
        const weekDate = new Date(now);
        const day = weekDate.getDay();
        const diff = weekDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(weekDate.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        break;
      }
    }

    // Obtener configuración del hub
    const config = await prisma.weekFlowConfig.findFirst({
      where: { hubId },
    });

    if (!config) {
      return NextResponse.json({ ok: false, error: "Config not found" }, { status: 404 });
    }

    // Obtener sesiones del periodo
    const sessions = await prisma.weekFlowSession.findMany({
      where: {
        hubId,
        weekStart: { gte: startDate },
      },
      include: {
        moodCheckins: true,
        contributions: {
          where: { status: "ACTIVE" },
        },
      },
    });

    // Filtro base para tareas
    const taskWhere: Record<string, unknown> = {
      hubId,
      createdAt: { gte: startDate },
    };

    if (userId) {
      taskWhere.userId = userId;
    }

    // Obtener tareas del periodo
    const tasks = await prisma.rowiTask.findMany({
      where: taskWhere,
    });

    // Calcular métricas
    const totalCheckins = sessions.reduce((sum, s) => sum + s.moodCheckins.length, 0);
    const totalContributions = sessions.reduce((sum, s) => sum + s.contributions.length, 0);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "DONE").length;

    // Team Pulse - promedio de emociones
    const allMoodCheckins = sessions.flatMap((s) => s.moodCheckins);
    const moodCounts: Record<string, number> = {};
    let totalIntensity = 0;

    allMoodCheckins.forEach((checkin) => {
      moodCounts[checkin.emotion] = (moodCounts[checkin.emotion] || 0) + 1;
      totalIntensity += checkin.intensity;
    });

    const dominantEmotion =
      Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const avgIntensity =
      allMoodCheckins.length > 0 ? totalIntensity / allMoodCheckins.length : 0;

    // Distribución de emociones para Team Pulse
    const emotionDistribution = Object.entries(moodCounts).map(([emotion, count]) => ({
      emotion,
      count,
      percentage: allMoodCheckins.length > 0 ? Math.round((count / allMoodCheckins.length) * 100) : 0,
    }));

    // Contribuciones por tipo
    const contributionsByType: Record<string, number> = {
      SHOW_TELL: 0,
      TO_DISCUSS: 0,
      FOCUS: 0,
    };

    sessions.forEach((s) => {
      s.contributions.forEach((c) => {
        contributionsByType[c.type] = (contributionsByType[c.type] || 0) + 1;
      });
    });

    // Participación (usuarios únicos con check-in / total miembros)
    const uniqueCheckinUsers = new Set(allMoodCheckins.map((c) => c.userId)).size;

    // Obtener total de miembros del hub (o RowiCommunity)
    let hubMembers = await prisma.communityMember.count({
      where: { hubId },
    });
    // Si no hay miembros via CommunityMember, buscar en RowiCommunity
    if (hubMembers === 0) {
      hubMembers = await prisma.rowiCommunityUser.count({
        where: { communityId: hubId },
      });
    }

    const participationRate =
      hubMembers > 0 ? Math.round((uniqueCheckinUsers / hubMembers) * 100) : 0;

    // Streak de semanas consecutivas (para el hub)
    const consecutiveWeeks = calculateConsecutiveWeeks(sessions);

    // Tasa de completar tareas
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const metrics = {
      period,
      startDate,
      endDate: now,

      // Resumen general
      summary: {
        totalCheckins,
        totalContributions,
        totalTasks,
        completedTasks,
        participationRate,
        taskCompletionRate,
        consecutiveWeeks,
      },

      // Team Pulse
      teamPulse: {
        dominantEmotion,
        avgIntensity: Math.round(avgIntensity * 10) / 10,
        emotionDistribution: emotionDistribution.sort((a, b) => b.count - a.count),
        totalResponses: allMoodCheckins.length,
      },

      // Contribuciones
      contributions: {
        byType: contributionsByType,
        total: totalContributions,
      },

      // Sesiones
      sessions: {
        count: sessions.length,
        withFullParticipation: sessions.filter(
          (s) => s.moodCheckins.length >= hubMembers * 0.8
        ).length,
      },
    };

    return NextResponse.json({ ok: true, metrics });
  } catch (error) {
    console.error("[WeekFlow Metrics GET]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

interface SessionWithDates {
  year: number;
  weekNumber: number;
}

function calculateConsecutiveWeeks(sessions: SessionWithDates[]): number {
  if (sessions.length === 0) return 0;

  // Ordenar por año y semana descendente
  const sorted = [...sessions].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.weekNumber - a.weekNumber;
  });

  let streak = 1;
  let prevYear = sorted[0].year;
  let prevWeek = sorted[0].weekNumber;

  for (let i = 1; i < sorted.length; i++) {
    const { year, weekNumber } = sorted[i];

    // Verificar si es la semana anterior
    let isConsecutive = false;

    if (year === prevYear && weekNumber === prevWeek - 1) {
      isConsecutive = true;
    } else if (year === prevYear - 1 && prevWeek === 1 && weekNumber >= 52) {
      // Cambio de año
      isConsecutive = true;
    }

    if (isConsecutive) {
      streak++;
      prevYear = year;
      prevWeek = weekNumber;
    } else {
      break;
    }
  }

  return streak;
}
