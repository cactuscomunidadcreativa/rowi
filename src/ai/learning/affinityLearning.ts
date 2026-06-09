// src/ai/learning/affinityLearning.ts
import { prisma } from "@/core/prisma";

/* =========================================================
   💬 Tipos principales de interacción y afinidad
   ---------------------------------------------------------
   Define la estructura básica de las interacciones que
   influyen en el aprendizaje emocional y social de Rowi.
========================================================= */
type InteractionInput = {
  userId: string;
  memberId: string;
  context?: string;            // p.ej. "execution", "innovation", "leadership"
  emotionTag?: "positiva" | "neutral" | "tensa";
  effectiveness?: number;      // 0..1 — indica el éxito o resonancia
  notes?: string;              // observaciones de la interacción
};

/* =========================================================
   🧠 logAffinityInteraction()
   ---------------------------------------------------------
   Registra una interacción emocional entre usuario y miembro.
   Se usa en eventos de comunicación o entrenamiento.
========================================================= */
export async function logAffinityInteraction(payload: InteractionInput) {
  try {
    // Si la tabla no existe (dev o migración reciente), no romper.
    // @ts-ignore
    await prisma.affinityInteraction.create({
      data: {
        userId: payload.userId,
        memberId: payload.memberId,
        context: payload.context ?? null,
        emotionTag: payload.emotionTag ?? null,
        effectiveness:
          typeof payload.effectiveness === "number"
            ? Math.max(0, Math.min(1, payload.effectiveness))
            : null,
        notes: payload.notes ?? null,
      },
    });
  } catch (e) {
    console.warn(
      "[affinityLearning] ⚠️ Tabla 'affinityInteraction' ausente o no migrada aún (safe to ignore en dev)."
    );
  }
}

/* =========================================================
   🔗 persistHeat135ToDyad()
   ---------------------------------------------------------
   Persiste la lectura de sintonía (heat135) en el RelationshipDyad para que
   ECO salga de modo neutro. ecoBridge lee `dyad.lastGapSummary.heat135`; los
   cálculos de affinity sí lo computan pero nunca lo escribían en la díada
   (eslabón roto). Aquí lo cerramos.

   El matching es conservador: solo cuando memberId es un usuario Rowi
   ("user_<id>") podemos atar a la díada por otherUserId. Si no hay díada, es
   un no-op silencioso (no rompe el cálculo de affinity). La heat135 NUNCA es
   un veredicto de compatibilidad — es la escala de la BRECHA (sintonía).
========================================================= */
export async function persistHeat135ToDyad(params: {
  ownerUserId: string;
  memberId: string;
  context: string;
  heat135: number;
}) {
  try {
    // Solo atamos a díada cuando el "miembro" es un usuario Rowi real.
    if (!params.memberId.startsWith("user_")) return;
    const otherUserId = params.memberId.replace("user_", "");

    const dyad = await prisma.relationshipDyad.findFirst({
      where: { ownerUserId: params.ownerUserId, otherUserId },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    if (!dyad) return; // no hay díada declarada: no-op

    await prisma.relationshipDyad.update({
      where: { id: dyad.id },
      data: {
        lastGapSummary: {
          heat135: Math.round(params.heat135),
          heat100: Math.round((params.heat135 / 135) * 100),
          context: params.context,
        },
        lastGapAt: new Date(),
      },
    });
  } catch (e) {
    console.warn(
      "[affinityLearning] ⚠️ No se pudo persistir heat135 en la díada (díada ausente o sin migrar)."
    );
  }
}

/* =========================================================
   📊 summarizeSignals()
   ---------------------------------------------------------
   Resume las señales emocionales recientes (últimos X días):
   - engagement → número de interacciones
   - tone        → tono predominante ("positiva", "tensa", "neutral")
   - effAvg      → promedio de efectividad (0..1)
========================================================= */
export async function summarizeSignals(
  userId: string,
  memberId: string,
  days = 30
) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  let rows: any[] = [];

  try {
    // @ts-ignore
    rows = await prisma.affinityInteraction.findMany({
      where: { userId, memberId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    console.warn(
      "[affinityLearning] ⚠️ No se pudo obtener interacciones recientes (tabla inexistente o vacía)."
    );
    return { engagement: 0, tone: "neutral", effAvg: 0.5 };
  }

  const engagement = rows.length;
  const effAvg = rows.length
    ? rows.reduce(
        (p, r) =>
          p + (typeof r.effectiveness === "number" ? r.effectiveness : 0.5),
        0
      ) / rows.length
    : 0.5;

  // Detección de tono dominante (positiva, tensa, neutral)
  const pos = rows.filter((r) => r.emotionTag === "positiva").length;
  const tens = rows.filter((r) => r.emotionTag === "tensa").length;
  const tone = pos > tens ? "positiva" : tens > pos ? "tensa" : "neutral";

  return { engagement, tone, effAvg };
}

/* =========================================================
   🧩 upsertAdaptiveSnapshot()
   ---------------------------------------------------------
   Ajusta o crea un Snapshot adaptativo de afinidad emocional.
   Este snapshot sirve como memoria dinámica que Rowi usa
   para ajustar la relación usuario–miembro con aprendizaje.
========================================================= */
export async function upsertAdaptiveSnapshot(params: {
  userId: string;
  memberId: string;
  context: string;
  biasFactor: number;
  closenessDynamic: "Cercano" | "Neutral" | "Lejano";
  aiSummary?: string | null;
  heat135?: number | null;
}) {
  try {
    // @ts-ignore
    await prisma.affinitySnapshot.upsert({
      where: {
        userId_memberId_context: {
          userId: params.userId,
          memberId: params.memberId,
          context: params.context,
        },
      },
      create: {
        userId: params.userId,
        memberId: params.memberId,
        context: params.context,
        biasFactor: params.biasFactor,
        closeness: params.closenessDynamic,
        aiSummary: params.aiSummary ?? null,
        lastHeat135: params.heat135 ?? null,
      },
      update: {
        biasFactor: params.biasFactor,
        closeness: params.closenessDynamic,
        aiSummary: params.aiSummary ?? null,
        lastHeat135: params.heat135 ?? null,
        updatedAt: new Date(),
      },
    });
  } catch (e) {
    console.warn(
      "[affinityLearning] ⚠️ No se pudo actualizar 'affinitySnapshot' (tabla opcional o sin migrar)."
    );
  }
}