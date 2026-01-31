import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";
import { summarizeSignals, upsertAdaptiveSnapshot } from "@/ai/learning/affinityLearning";

/**
 * =========================================================
 * 🔄 POST /api/affinity/recalculate
 * ---------------------------------------------------------
 * Recalcula la afinidad entre el usuario y sus miembros
 * aplicando aprendizaje basado en señales reales.
 *
 * Body (opcional):
 *  - context: string (default: "execution")
 *  - force: boolean (recalcular aunque no hayan pasado 15 días)
 *  - days: number (ventana de aprendizaje, default: 30)
 * =========================================================
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const context = body.context || "execution";
    const days = body.days || 30;

    const result = await autoRecalcAffinity({ userId, context, days });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Error POST /api/affinity/recalculate:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🔧 Auto Recalc de Afinidad Inteligente
========================================================= */
type AutoRecalcOptions = {
  userId: string;
  context?: string;
  force?: boolean;
  days?: number;
};

async function autoRecalcAffinity({
  userId,
  context = "execution",
  days = 30,
}: AutoRecalcOptions) {
  const start = Date.now();
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Usuario no encontrado");

    const members = await prisma.communityMember.findMany({
      where: { ownerId: userId },
      select: { id: true, name: true, closeness: true },
      orderBy: { joinedAt: "desc" },
      take: 500,
    });

    const results: any[] = [];

    for (const m of members) {
      const signals = await summarizeSignals(userId, m.id, days);
      const biasAdj = signals.effAvg >= 0.8 ? 1.08 : signals.effAvg <= 0.4 ? 0.92 : 1.0;
      const closenessDynamic =
        signals.tone === "positiva"
          ? "Cercano"
          : signals.tone === "tensa"
          ? "Lejano"
          : "Neutral";

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

    const duration = ((Date.now() - start) / 1000).toFixed(1);
    await prisma.batch.create({
      data: {
        ownerId: userId,
        name: `AutoRecalc Affinity (${context})`,
        description: `Recalculadas ${results.length} relaciones en ${duration}s.`,
        type: "affinity",
        count: results.length,
        status: "completado",
        startedAt: new Date(),
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

function avg135(xs: Array<number | null | undefined>): number {
  const valid = xs.filter((x): x is number => typeof x === "number" && x > 0);
  if (!valid.length) return 90;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}
