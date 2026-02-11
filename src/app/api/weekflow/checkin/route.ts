import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

/**
 * GET /api/weekflow/checkin?sessionId=xxx
 * Obtiene el check-in del usuario actual para una sesión
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Plan check bypassed — WeekFlow open for all users
    // if (!auth.plan?.weekflowAccess) { ... }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "sessionId required" }, { status: 400 });
    }

    const [checkin, vocabulary] = await Promise.all([
      prisma.weekFlowMoodCheckin.findUnique({
        where: {
          sessionId_userId: {
            sessionId,
            userId: auth.id,
          },
        },
      }),
      prisma.emotionVocabulary.findUnique({
        where: { userId: auth.id },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      checkin,
      vocabulary: vocabulary || {
        level: "DESAFIO",
        totalCheckins: 0,
        uniqueEmotionsUsed: 0,
        progressToNextLevel: 0,
      },
    });
  } catch (error) {
    console.error("[WeekFlow Checkin GET]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/weekflow/checkin
 * Crea o actualiza el mood check-in del usuario
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Plan check bypassed — WeekFlow open for all users
    // if (!auth.plan?.weekflowAccess) { ... }

    const body = await req.json();
    const { sessionId, emotion, intensity, note } = body;

    if (!sessionId || !emotion) {
      return NextResponse.json(
        { ok: false, error: "sessionId and emotion are required" },
        { status: 400 }
      );
    }

    // Validar emoción (acepta Plutchik base + Rueda de Sentimientos + secundarias)
    if (typeof emotion !== "string" || emotion.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "Invalid emotion format" }, { status: 400 });
    }

    // Validar intensidad (1-10)
    const validIntensity = Math.min(10, Math.max(1, intensity || 5));

    // Verificar que la sesión existe
    const session = await prisma.weekFlowSession.findUnique({
      where: { id: sessionId },
      include: { config: true },
    });

    if (!session) {
      return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 });
    }

    // Upsert del check-in
    const checkin = await prisma.weekFlowMoodCheckin.upsert({
      where: {
        sessionId_userId: {
          sessionId,
          userId: auth.id,
        },
      },
      update: {
        emotion,
        intensity: validIntensity,
        note: note || null,
      },
      create: {
        sessionId,
        userId: auth.id,
        emotion,
        intensity: validIntensity,
        note: note || null,
      },
    });

    // Actualizar vocabulario emocional del usuario
    await updateEmotionVocabulary(auth.id, emotion);

    // TODO: Integrar con gamificación
    // await recordActivity({ userId: auth.id, type: "WEEKFLOW_CHECKIN", points: session.config.pointsPerCheckin });

    return NextResponse.json({ ok: true, checkin });
  } catch (error) {
    console.error("[WeekFlow Checkin POST]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * Actualiza el vocabulario emocional del usuario
 * Incrementa el contador y desbloquea emociones según progresión
 */
async function updateEmotionVocabulary(userId: string, emotion: string) {
  try {
    // Buscar o crear vocabulario
    let vocabulary = await prisma.emotionVocabulary.findUnique({
      where: { userId },
    });

    if (!vocabulary) {
      vocabulary = await prisma.emotionVocabulary.create({
        data: {
          userId,
          level: "DESAFIO",
          unlockedEmotions: [],
          totalCheckins: 0,
          uniqueEmotionsUsed: 0,
        },
      });
    }

    // Actualizar estadísticas
    const unlockedEmotions = vocabulary.unlockedEmotions || [];
    const isNewEmotion = !unlockedEmotions.includes(emotion);

    const updateData: Record<string, unknown> = {
      totalCheckins: vocabulary.totalCheckins + 1,
    };

    if (isNewEmotion) {
      updateData.unlockedEmotions = [...unlockedEmotions, emotion];
      updateData.uniqueEmotionsUsed = vocabulary.uniqueEmotionsUsed + 1;
    }

    // Calcular nuevo nivel (Six Seconds)
    const newLevel = calculateEmotionLevel(
      vocabulary.totalCheckins + 1,
      vocabulary.uniqueEmotionsUsed + (isNewEmotion ? 1 : 0)
    );

    if (newLevel !== vocabulary.level) {
      updateData.level = newLevel;
      // TODO: Trigger achievement for level up
    }

    // Calcular progreso hacia siguiente nivel
    updateData.progressToNextLevel = calculateProgressToNextLevel(
      vocabulary.totalCheckins + 1,
      vocabulary.uniqueEmotionsUsed + (isNewEmotion ? 1 : 0),
      newLevel
    );

    await prisma.emotionVocabulary.update({
      where: { userId },
      data: updateData,
    });
  } catch (error) {
    console.error("[UpdateEmotionVocabulary]", error);
    // No fallamos silenciosamente, pero no bloqueamos el check-in
  }
}

/**
 * Calcula el nivel de vocabulario emocional según criterios Six Seconds
 */
function calculateEmotionLevel(
  totalCheckins: number,
  uniqueEmotions: number
): "DESAFIO" | "EMERGENTE" | "FUNCIONAL" | "DIESTRO" | "EXPERTO" {
  // Nivel 5: Experto - 100+ check-ins + 50 emociones únicas
  if (totalCheckins >= 100 && uniqueEmotions >= 50) {
    return "EXPERTO";
  }
  // Nivel 4: Diestro - 50+ check-ins + 30 emociones únicas
  if (totalCheckins >= 50 && uniqueEmotions >= 30) {
    return "DIESTRO";
  }
  // Nivel 3: Funcional - 20+ check-ins + 15 emociones únicas
  if (totalCheckins >= 20 && uniqueEmotions >= 15) {
    return "FUNCIONAL";
  }
  // Nivel 2: Emergente - 5+ check-ins
  if (totalCheckins >= 5) {
    return "EMERGENTE";
  }
  // Nivel 1: Desafío - Default
  return "DESAFIO";
}

/**
 * Calcula el progreso hacia el siguiente nivel (0-100%)
 */
function calculateProgressToNextLevel(
  totalCheckins: number,
  uniqueEmotions: number,
  currentLevel: string
): number {
  const requirements: Record<string, { checkins: number; emotions: number }> = {
    DESAFIO: { checkins: 5, emotions: 0 },
    EMERGENTE: { checkins: 20, emotions: 15 },
    FUNCIONAL: { checkins: 50, emotions: 30 },
    DIESTRO: { checkins: 100, emotions: 50 },
    EXPERTO: { checkins: 100, emotions: 50 }, // Max level
  };

  const nextLevel = {
    DESAFIO: "EMERGENTE",
    EMERGENTE: "FUNCIONAL",
    FUNCIONAL: "DIESTRO",
    DIESTRO: "EXPERTO",
    EXPERTO: "EXPERTO",
  }[currentLevel] as string;

  if (currentLevel === "EXPERTO") {
    return 100;
  }

  const req = requirements[nextLevel];
  const checkinProgress = Math.min(100, (totalCheckins / req.checkins) * 100);
  const emotionProgress = req.emotions > 0 ? Math.min(100, (uniqueEmotions / req.emotions) * 100) : 100;

  return Math.floor((checkinProgress + emotionProgress) / 2);
}
