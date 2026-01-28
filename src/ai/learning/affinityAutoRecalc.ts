// src/ai/learning/affinityAutoRecalc.ts
import { prisma } from "@/core/prisma";
import { summarizeSignals, upsertAdaptiveSnapshot } from "./affinityLearning";

/**
 * 🤖 Auto Recalc de Afinidad Inteligente (v1.4)
 * ------------------------------------------------------------
 * Recalcula la afinidad entre el usuario (A) y sus miembros (B),
 * aplicando aprendizaje basado en señales de interacción reales
 * (tono, efectividad, frecuencia, etc.).
 *
 * Se usa en:
 *  - /api/affinity/recalculate
 *  - Cron jobs automáticos (cada 15 días)
 *  - Eventos de interacción intensiva (≥10 interacciones/mes)
 */

type AutoRecalcOptions = {
  userId: string;
  context?: string;
  force?: boolean; // recalcular aunque no haya pasado el tiempo mínimo
  days?: number; // ventana de aprendizaje (por defecto 30 días)
};

export async function autoRecalcAffinity({
  userId,
  context = "execution",
  force = false,
  days = 30,
}: AutoRecalcOptions) {
  const start = Date.now();

  try {
    /* =========================================================
       🧠 Usuario base
    ========================================================== */
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Usuario no encontrado");

    /* =========================================================
       👥 Cargar miembros de comunidad (máx 500)
       - ✅ CAMBIO: ownerUserId → ownerId
       - Incluye campos útiles para IA contextual
    ========================================================== */
    const members = await prisma.communityMember.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        group: true,
        connectionType: true,
        country: true,
        brainStyle: true,
        closeness: true,
      },
      orderBy: { joinedAt: "desc" },
      take: 500,
    });

    const results: any[] = [];

    /* =========================================================
       🔁 Procesamiento iterativo de miembros
    ========================================================== */
    for (const m of members) {
      // 1️⃣ Extraer señales de interacción recientes
      const signals = await summarizeSignals(userId, m.id, days);

      const biasAdj =
        signals.effAvg >= 0.8 ? 1.08 : signals.effAvg <= 0.4 ? 0.92 : 1.0;

      const closenessDynamic =
        signals.tone === "positiva"
          ? "Cercano"
          : signals.tone === "tensa"
          ? "Lejano"
          : "Neutral";

      // 2️⃣ Buscar snapshots EQ de usuario y miembro
      const snapUser = await prisma.eqSnapshot.findFirst({
        where: { userId, dataset: "actual" },
        orderBy: { at: "desc" },
      });

      const snapMember = await prisma.eqSnapshot.findFirst({
        where: { memberId: m.id, dataset: "actual" },
        orderBy: { at: "desc" },
      });

      if (!snapUser || !snapMember) continue; // si no hay datos EQ, se salta

      // 3️⃣ Promedio normalizado 135 (0-135)
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

      // 4️⃣ Guardar snapshot adaptativo (aprendizaje incremental)
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
       🪶 Registrar lote (Batch) en histórico
       - ✅ CAMBIO: ownerUserId → ownerId
    ========================================================== */
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    await prisma.batch.create({
      data: {
        ownerId: userId,
        name: `AutoRecalc Affinity (${context})`,
        description: `Recalculadas ${results.length} relaciones en ${duration}s.`,
        type: "affinity",
        count: results.length,
        status: "completado",
      },
    });

    /* =========================================================
       🧾 Resultado agregado
    ========================================================== */
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
    console.error("❌ [autoRecalcAffinity] Error:", e);
    return { ok: false, error: e?.message || "Error desconocido" };
  }
}

/* =========================================================
   🔧 Utilidad interna — Promedio 135
========================================================= */
function avg135(xs: Array<number | null | undefined>): number {
  const valid = xs.filter((x): x is number => typeof x === "number" && x > 0);
  if (!valid.length) return 90; // valor neutral si no hay datos
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}