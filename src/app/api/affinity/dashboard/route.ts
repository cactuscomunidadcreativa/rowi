import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

/**
 * 🧭 AFFINITY DASHBOARD
 * ---------------------------------------------------------
 * Funde los módulos Summary + Interaction + Snapshot
 * para ofrecer un panel emocional completo:
 * - Afinidad global y por grupo
 * - Frecuencia de interacción
 * - Emociones predominantes
 * - Top relaciones destacadas
 */
export async function GET(req: NextRequest) {
  try {
    // ======================================================
    // 🔐 Autenticación
    // ======================================================
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase() || null;
    if (!email)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const me = await prisma.user.findUnique({ where: { email } });
    if (!me)
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" });

    // ======================================================
    // 📊 Cargar datos de afinidad (últimos snapshots)
    // ======================================================
    const snapshots = await prisma.affinitySnapshot.findMany({
      where: { userId: me.id },
      select: {
        memberId: true,
        context: true,
        lastHeat135: true,
        aiSummary: true,
        closeness: true,
        updatedAt: true,
        member: {
          select: {
            name: true,
            brainStyle: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 300,
    });

    // Agrupar por nivel de afinidad
    const avgHeat = (arr: number[]) =>
      arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
    const heats = snapshots.map((s) =>
      Math.min(100, Math.round(((s.lastHeat135 ?? 0) / 135) * 100))
    );
    const globalHeat = avgHeat(heats);
    const band =
      globalHeat >= 70 ? "hot" : globalHeat >= 45 ? "warm" : "cold";

    // Top 5 conexiones más fuertes
    const topMembers = snapshots
      .sort((a, b) => (b.lastHeat135 ?? 0) - (a.lastHeat135 ?? 0))
      .slice(0, 5)
      .map((s) => ({
        memberId: s.memberId,
        memberName: s.member?.name || "Sin nombre",
        brainStyle: s.member?.brainStyle || null,
        heat: Math.round(((s.lastHeat135 ?? 0) / 135) * 100),
        band: (s.lastHeat135 ?? 0) >= 95 ? "hot" : (s.lastHeat135 ?? 0) >= 62 ? "warm" : "cold",
        context: s.context,
        closeness: s.closeness,
        updatedAt: s.updatedAt,
        aiSummary: s.aiSummary,
      }));

    // ======================================================
    // 💬 Cargar interacciones recientes (últimos 30 días)
    // ======================================================
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const interactions = await prisma.affinityInteraction.findMany({
      where: { userId: me.id, createdAt: { gte: cutoff } },
      select: { emotionTag: true, effectiveness: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const emotions: Record<string, number> = {};
    const effs: number[] = [];

    for (const i of interactions) {
      if (i.emotionTag) {
        emotions[i.emotionTag] = (emotions[i.emotionTag] || 0) + 1;
      }
      if (typeof i.effectiveness === "number") {
        effs.push(i.effectiveness);
      }
    }

    // Emociones predominantes
    const topEmotions = Object.entries(emotions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    const avgEffectiveness =
      effs.length > 0
        ? Math.round((effs.reduce((a, b) => a + b, 0) / effs.length) * 100)
        : null;

    // ======================================================
    // 📅 Frecuencia de interacción semanal
    // ======================================================
    const weekData: Record<string, number> = {};
    for (const i of interactions) {
      const d = new Date(i.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      weekData[key] = (weekData[key] || 0) + 1;
    }
    const daily = Object.entries(weekData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // ======================================================
    // ✅ Respuesta final
    // ======================================================
    return NextResponse.json({
      ok: true,
      global: {
        heat: globalHeat,
        band,
        relationships: heats.length,
        avgEffectiveness,
        topEmotions,
      },
      topMembers,
      interactions: {
        total: interactions.length,
        daily,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[/api/affinity/dashboard] Error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✅ Export final del runtime
========================================================= */
export const dynamic = "force-dynamic";
export const preferredRegion = "auto";