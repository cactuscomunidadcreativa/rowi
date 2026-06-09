// src/ai/learning/affinityAutoRecalc.ts
import { prisma } from "@/core/prisma";
import { summarizeSignals, upsertAdaptiveSnapshot } from "./affinityLearning";
import { loadAffinityWeights } from "./affinityWeightsLoader";
import {
  N as engineN,
  compAffinity135,
  collaboration135,
  understanding135,
  talentSynergyFactor,
  resolveCtx,
  type Project,
} from "@/domains/affinity/lib/affinityEngine";

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

    // Pesos calibrados (si existen) — fallback a hipótesis v0 hardcoded.
    const weightOverride = await loadAffinityWeights("global");
    const proj = context as Project;

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

      // 2️⃣ Buscar snapshots EQ de usuario y miembro (sin filtrar dataset)
      const snapUser = await prisma.eqSnapshot.findFirst({
        where: { userId },
        orderBy: { at: "desc" },
      });

      const snapMember = await prisma.eqSnapshot.findFirst({
        where: { memberId: m.id },
        orderBy: { at: "desc" },
      });

      if (!snapUser || !snapMember) continue; // si no hay datos EQ, se salta

      // 3️⃣ Cálculo con el MOTOR REAL (no fórmula paralela).
      //     Carga outcomes + talentos para alimentar las 3 dimensiones.
      const [outsUser, outsMember, talsUserRows, talsMemberRows] = await Promise.all([
        prisma.eqOutcomeSnapshot.findMany({ where: { snapshotId: snapUser.id } }),
        prisma.eqOutcomeSnapshot.findMany({ where: { snapshotId: snapMember.id } }),
        prisma.talentSnapshot.findMany({ where: { snapshotId: snapUser.id } }),
        prisma.talentSnapshot.findMany({ where: { snapshotId: snapMember.id } }),
      ]);

      const compUser = {
        EL: engineN(snapUser.EL), RP: engineN(snapUser.RP), ACT: engineN(snapUser.ACT), NE: engineN(snapUser.NE),
        IM: engineN(snapUser.IM), OP: engineN(snapUser.OP), EMP: engineN(snapUser.EMP), NG: engineN(snapUser.NG),
      };
      const compMember = {
        EL: engineN(snapMember.EL), RP: engineN(snapMember.RP), ACT: engineN(snapMember.ACT), NE: engineN(snapMember.NE),
        IM: engineN(snapMember.IM), OP: engineN(snapMember.OP), EMP: engineN(snapMember.EMP), NG: engineN(snapMember.NG),
      };
      const talsUser: Record<string, number | null> = {};
      const talsMember: Record<string, number | null> = {};
      talsUserRows.forEach((t) => (talsUser[t.key] = engineN(t.score)));
      talsMemberRows.forEach((t) => (talsMember[t.key] = engineN(t.score)));

      const { score: growth } = compAffinity135(compUser, compMember, proj);
      const tFactor = talentSynergyFactor(proj, talsUser, talsMember);
      const collab = collaboration135(snapUser.brainStyle, snapMember.brainStyle, compUser, compMember, tFactor);
      const understand = understanding135(outsUser, outsMember, proj);

      // Mezcla ponderada del contexto (pesos calibrados si existen).
      const W = resolveCtx(proj, weightOverride);
      // biasAdj = lo APRENDIDO de las interacciones reales (señal de aprendizaje).
      const composite = (W.growth * growth + W.collab * collab + W.understand * understand) * biasAdj;
      const heat135 = Math.min(135, Math.max(0, Math.round(composite)));

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