// src/ai/learning/affinityAutoRecalc.ts
import { prisma } from "@/core/prisma";
import { summarizeSignals, upsertAdaptiveSnapshot } from "@/ai/learning/affinityLearning";

/**
 * ✅ Auto Recalc de Afinidad Inteligente (v1.3)
 * ------------------------------------------------------------
 * Este módulo recalcula la afinidad entre el usuario (A) y sus miembros (B)
 * aplicando aprendizaje basado en señales reales (interacciones, tono, efectividad).
 *
 * Se usa en:
 *  - /api/affinity/recalculate
 *  - Cron jobs periódicos (cada 15 días)
 *  - Eventos de alta interacción (≥ 10 interacciones / mes)
 */

type AutoRecalcOptions = {
  userId: string;
  context?: string;
  force?: boolean; // recalcular incluso si no ha pasado 15 días
  days?: number;   // ventana de aprendizaje (default: 30 días)
};

export async function autoRecalcAffinity({
  userId,
  context = "execution",
  force = false,
  days = 30,
}: AutoRecalcOptions) {
  const start = Date.now();
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Usuario no encontrado");

    /* =========================================================
       👥 Obtener miembros del usuario (propietario)
       ✅ CAMBIO: ownerUserId → ownerId
    ========================================================== */
    const members = await prisma.communityMember.findMany({
      where: { ownerId: userId }, // ✅ campo correcto
      select: { id: true, name: true, closeness: true },
      orderBy: { joinedAt: "desc" }, // ✅ usa joinedAt existente
      take: 500,
    });

    const results: any[] = [];

    for (const m of members) {
      /* =========================================================
         🧭 Aprendizaje: resumen de señales (últimos X días)
      ========================================================== */
      const signals = await summarizeSignals(userId, m.id, days);
      const biasAdj = signals.effAvg >= 0.8 ? 1.08 : signals.effAvg <= 0.4 ? 0.92 : 1.0;
      const closenessDynamic =
        signals.tone === "positiva"
          ? "Cercano"
          : signals.tone === "tensa"
          ? "Lejano"
          : "Neutral";

      /* =========================================================
         📈 Cálculo rápido de afinidad (fallback si no hay snapshot)
      ========================================================== */
      const snapUser = await prisma.eqSnapshot.findFirst({
        where: { userId, dataset: "actual" },
        orderBy: { at: "desc" },
      });
      const snapMember = await prisma.eqSnapshot.findFirst({
        where: { memberId: m.id, dataset: "actual" },
        orderBy: { at: "desc" },
      });

      if (!snapUser || !snapMember) continue;

      const compsUser = [
        snapUser.EL, snapUser.RP, snapUser.ACT, snapUser.NE,
        snapUser.IM, snapUser.OP, snapUser.EMP, snapUser.NG,
      ];
      const compsMember = [
        snapMember.EL, snapMember.RP, snapMember.ACT, snapMember.NE,
        snapMember.IM, snapMember.OP, snapMember.EMP, snapMember.NG,
      ];

      const avgUser = avg135(compsUser);
      const avgMember = avg135(compsMember);
      const baseHeat = ((avgUser + avgMember) / 2) * biasAdj;
      const heat135 = Math.min(135, Math.round(baseHeat));

      /* =========================================================
         💾 Guardar Snapshot adaptativo (Rowi Learning)
      ========================================================== */
      await upsertAdaptiveSnapshot({
        userId,
        memberId: m.id,
        context,
        biasFactor: biasAdj,
        closenessDynamic,
        heat135,
        aiSummary: `Aprendido (${signals.engagement} interacciones, tono ${signals.tone}, eficacia ${(signals.effAvg * 100).toFixed(0)}%)`,
      });

      results.push({
        memberId: m.id,
        name: m.name,
        biasFactor: biasAdj,
        closeness: closenessDynamic,
        heat135,
      });
    }

    /* =========================================================
       🪶 Registrar lote en Batch (para histórico / auditoría)
       ✅ CAMBIO: ownerUserId → ownerId + startedAt
    ========================================================== */
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    await prisma.batch.create({
      data: {
        ownerId: userId, // ✅ campo correcto
        name: `AutoRecalc Affinity (${context})`,
        description: `Recalculadas ${results.length} relaciones en ${duration}s.`,
        type: "affinity",
        count: results.length,
        status: "completado",
        startedAt: new Date(), // ✅ agregado
      },
    });

    return {
      ok: true,
      count: results.length,
      duration: `${duration}s`,
      items: results,
      summary: {
        avgHeat: results.length
          ? Math.round(results.reduce((a, b) => a + b.heat135, 0) / results.length)
          : 0,
        avgBias: results.length
          ? Math.round(
              (results.reduce((a, b) => a + b.biasFactor, 0) / results.length) * 100
            ) / 100
          : 1.0,
      },
    };
  } catch (e: any) {
    console.error("[autoRecalcAffinity] error:", e);
    return { ok: false, error: e?.message || "Error desconocido" };
  }
}

/* =========================================================
   🔧 Utilidad interna: promedio ponderado 135
========================================================= */
function avg135(xs: Array<number | null | undefined>): number {
  const valid = xs.filter((x): x is number => typeof x === "number" && x > 0);
  if (!valid.length) return 90;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}