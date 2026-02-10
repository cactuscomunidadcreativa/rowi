import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

/**
 * GET /api/weekflow/tasks/insights
 * Obtiene insights emocionales de las tareas del usuario
 * Query params:
 *   - period: WEEKLY, MONTHLY, QUARTERLY (default: MONTHLY)
 *   - hubId: filtrar por hub (opcional)
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Plan check bypassed — WeekFlow open for all users

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "MONTHLY";
    const hubId = searchParams.get("hubId");

    // Calcular fechas según periodo
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "WEEKLY":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "QUARTERLY":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "MONTHLY":
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const where: Record<string, unknown> = {
      userId: auth.id,
      createdAt: { gte: startDate },
    };

    if (hubId) {
      where.hubId = hubId;
    }

    // Obtener todas las tareas del periodo
    const tasks = await prisma.rowiTask.findMany({
      where,
      include: {
        reflections: true,
      },
    });

    // Obtener check-ins de mood del periodo
    const moodCheckins = await prisma.weekFlowMoodCheckin.findMany({
      where: {
        userId: auth.id,
        createdAt: { gte: startDate },
      },
    });

    // Calcular insights
    const insights = calculateInsights(tasks, moodCheckins);

    return NextResponse.json({ ok: true, insights, period });
  } catch (error) {
    console.error("[WeekFlow Tasks Insights GET]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

interface TaskWithReflections {
  id: string;
  status: string;
  priority: string;
  emotionAtCreation: string | null;
  emotionAtCompletion: string | null;
  incompletionReason: string | null;
  createdAt: Date;
  completedAt: Date | null;
  reflections: Array<{
    type: string;
    emotion: string | null;
    blockerType: string | null;
  }>;
}

interface MoodCheckin {
  emotion: string;
  createdAt: Date;
}

function calculateInsights(tasks: TaskWithReflections[], moodCheckins: MoodCheckin[]) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const postponedTasks = tasks.filter((t) => t.status === "POSTPONED").length;
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED").length;

  // Tasa de completar general
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Tasa de completar por emoción (usando mood check-in de la semana)
  const completionByEmotion: Record<string, { completed: number; total: number }> = {};

  // Agrupar tareas por semana y correlacionar con mood
  const tasksByWeek = groupTasksByWeek(tasks);
  const moodByWeek = groupMoodByWeek(moodCheckins);

  for (const [weekKey, weekTasks] of Object.entries(tasksByWeek)) {
    const weekMood = moodByWeek[weekKey];
    if (weekMood) {
      if (!completionByEmotion[weekMood]) {
        completionByEmotion[weekMood] = { completed: 0, total: 0 };
      }
      completionByEmotion[weekMood].total += weekTasks.length;
      completionByEmotion[weekMood].completed += weekTasks.filter((t) => t.status === "DONE").length;
    }
  }

  // Razones de no completar más comunes
  const incompletionReasons: Record<string, number> = {};
  tasks
    .filter((t) => t.incompletionReason)
    .forEach((t) => {
      const reason = t.incompletionReason!;
      incompletionReasons[reason] = (incompletionReasons[reason] || 0) + 1;
    });

  const topIncompletionReasons = Object.entries(incompletionReasons)
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: Math.round((count / (postponedTasks + blockedTasks || 1)) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Emociones más frecuentes al completar
  const emotionsAtCompletion: Record<string, number> = {};
  tasks
    .filter((t) => t.emotionAtCompletion && t.status === "DONE")
    .forEach((t) => {
      const emotion = t.emotionAtCompletion!;
      emotionsAtCompletion[emotion] = (emotionsAtCompletion[emotion] || 0) + 1;
    });

  // Tipo de bloqueador más común
  const blockerTypes: Record<string, number> = {};
  tasks.forEach((t) => {
    t.reflections
      .filter((r) => r.blockerType)
      .forEach((r) => {
        blockerTypes[r.blockerType!] = (blockerTypes[r.blockerType!] || 0) + 1;
      });
  });

  // Patrones detectados
  const patterns: string[] = [];

  // Patrón: Pospones más cuando estás con cierta emoción
  for (const [emotion, data] of Object.entries(completionByEmotion)) {
    const rate = data.total > 0 ? (data.completed / data.total) * 100 : 0;
    if (rate < 40 && data.total >= 3) {
      patterns.push(`weekflow.tasks.insights.pattern.lowCompletion:${emotion}:${Math.round(rate)}`);
    }
    if (rate > 80 && data.total >= 3) {
      patterns.push(`weekflow.tasks.insights.pattern.highCompletion:${emotion}:${Math.round(rate)}`);
    }
  }

  // Patrón: Razón emocional más común
  const emotionalReasons = ["OVERWHELMED", "ANXIOUS", "UNMOTIVATED", "PERFECTIONISM", "FEAR_OF_FAILURE"];
  const totalEmotionalBlocks = topIncompletionReasons
    .filter((r) => emotionalReasons.includes(r.reason))
    .reduce((sum, r) => sum + r.count, 0);

  if (totalEmotionalBlocks > 3) {
    const topEmotional = topIncompletionReasons.find((r) => emotionalReasons.includes(r.reason));
    if (topEmotional) {
      patterns.push(`weekflow.tasks.insights.pattern.emotionalBlocker:${topEmotional.reason}`);
    }
  }

  // Sugerencias basadas en patrones
  const suggestions: string[] = [];

  if (topIncompletionReasons.some((r) => r.reason === "OVERWHELMED" && r.count >= 2)) {
    suggestions.push("weekflow.tasks.insights.suggestion.breakDown");
  }

  if (topIncompletionReasons.some((r) => r.reason === "PERFECTIONISM" && r.count >= 2)) {
    suggestions.push("weekflow.tasks.insights.suggestion.goodEnough");
  }

  if (topIncompletionReasons.some((r) => r.reason === "ANXIOUS" && r.count >= 2)) {
    suggestions.push("weekflow.tasks.insights.suggestion.smallSteps");
  }

  if (blockerTypes["external"] > blockerTypes["emotional"]) {
    suggestions.push("weekflow.tasks.insights.suggestion.dependencies");
  }

  // Vocabulario emocional del usuario
  const uniqueEmotionsUsed = new Set([
    ...tasks.filter((t) => t.emotionAtCreation).map((t) => t.emotionAtCreation),
    ...tasks.filter((t) => t.emotionAtCompletion).map((t) => t.emotionAtCompletion),
    ...moodCheckins.map((c) => c.emotion),
  ]).size;

  return {
    summary: {
      totalTasks,
      completedTasks,
      postponedTasks,
      blockedTasks,
      completionRate,
    },
    completionByEmotion,
    topIncompletionReasons,
    emotionsAtCompletion,
    blockerTypes,
    patterns,
    suggestions,
    emotionalVocabulary: {
      uniqueEmotionsUsed,
    },
  };
}

function groupTasksByWeek(tasks: TaskWithReflections[]): Record<string, TaskWithReflections[]> {
  const result: Record<string, TaskWithReflections[]> = {};

  tasks.forEach((task) => {
    const weekKey = getWeekKey(task.createdAt);
    if (!result[weekKey]) {
      result[weekKey] = [];
    }
    result[weekKey].push(task);
  });

  return result;
}

function groupMoodByWeek(checkins: MoodCheckin[]): Record<string, string> {
  const result: Record<string, string> = {};

  // Usar el mood más reciente de cada semana
  checkins.forEach((checkin) => {
    const weekKey = getWeekKey(checkin.createdAt);
    result[weekKey] = checkin.emotion;
  });

  return result;
}

function getWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
}
