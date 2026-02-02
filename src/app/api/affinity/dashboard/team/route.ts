import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

/**
 * 👥 TEAM AFFINITY DASHBOARD
 * ---------------------------------------------------------
 * Resumen colectivo de afinidad y clima emocional por equipo (tenant).
 * Devuelve:
 * - Promedio global de afinidad del equipo
 * - Distribución por contexto
 * - Top emociones predominantes (últimos 30 días)
 * - Promedio de efectividad
 * - Ranking de miembros más conectados
 */
export async function GET(req: NextRequest) {
  try {
    // ======================================================
    // 🔐 Autenticación
    // ======================================================
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase() || null;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: missing token" },
        { status: 401 }
      );
    }

    // Buscar usuario autenticado
    const me = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        plan: true,
        primaryTenantId: true,
      },
    });

    if (!me) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (!me.primaryTenantId) {
      return NextResponse.json(
        { ok: false, error: "User has no tenant assigned" },
        { status: 400 }
      );
    }

    // ======================================================
    // 📊 Cargar miembros del mismo tenant
    // ======================================================
    const teamMembers = await prisma.user.findMany({
      where: { primaryTenantId: me.primaryTenantId },
      select: { id: true, name: true, email: true },
    });

    if (!teamMembers.length) {
      return NextResponse.json({
        ok: false,
        error: "No users found in this tenant",
      });
    }

    const userIds = teamMembers.map((u) => u.id);

    // ======================================================
    // 💾 Afinidad promedio del equipo
    // ======================================================
    const snapshots = await prisma.affinitySnapshot.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, lastHeat135: true, context: true },
    });

    const heats = snapshots.map((s) =>
      Math.round(((s.lastHeat135 ?? 0) / 135) * 100)
    );

    const avgHeat =
      heats.length > 0
        ? Math.round(
            (heats.reduce((a, b) => a + b, 0) / heats.length) * 10
          ) / 10
        : 0;

    const band = avgHeat >= 70 ? "hot" : avgHeat >= 45 ? "warm" : "cold";

    // ======================================================
    // 📈 Afinidad por contexto
    // ======================================================
    const byContext: Record<string, number[]> = {};
    for (const s of snapshots) {
      const ctx = s.context || "general";
      if (!byContext[ctx]) byContext[ctx] = [];
      byContext[ctx].push(Math.round(((s.lastHeat135 ?? 0) / 135) * 100));
    }

    const contextStats = Object.entries(byContext).map(([ctx, arr]) => {
      const avg =
        arr.length > 0
          ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
          : 0;
      const band =
        avg >= 70 ? "hot" : avg >= 45 ? "warm" : "cold";
      return { context: ctx, avg, band, count: arr.length };
    });

    // ======================================================
    // 💬 Emociones y efectividad (últimos 30 días)
    // ======================================================
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const interactions = await prisma.affinityInteraction.findMany({
      where: { userId: { in: userIds }, createdAt: { gte: cutoff } },
      select: { emotionTag: true, effectiveness: true },
    });

    const emotions: Record<string, number> = {};
    const effs: number[] = [];

    for (const i of interactions) {
      if (i.emotionTag)
        emotions[i.emotionTag] = (emotions[i.emotionTag] || 0) + 1;
      if (typeof i.effectiveness === "number") effs.push(i.effectiveness);
    }

    const avgEffectiveness =
      effs.length > 0
        ? Math.round(
            (effs.reduce((a, b) => a + b, 0) / effs.length) * 100
          )
        : null;

    const topEmotions = Object.entries(emotions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    // ======================================================
    // 🏆 Ranking de usuarios por afinidad promedio
    // ======================================================
    const userHeats: Record<string, number[]> = {};
    for (const s of snapshots) {
      if (!userHeats[s.userId]) userHeats[s.userId] = [];
      userHeats[s.userId].push(Math.round(((s.lastHeat135 ?? 0) / 135) * 100));
    }

    const ranking = Object.entries(userHeats)
      .map(([uid, arr]) => {
        const u = teamMembers.find((tm) => tm.id === uid);
        const avgHeat =
          arr.length > 0
            ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
            : 0;
        const band =
          avgHeat >= 70 ? "hot" : avgHeat >= 45 ? "warm" : "cold";
        return {
          userId: uid,
          name: u?.name || "Usuario",
          avgHeat,
          band,
          connections: arr.length,
        };
      })
      .sort((a, b) => b.avgHeat - a.avgHeat)
      .slice(0, 10);

    // ======================================================
    // ✅ Respuesta final
    // ======================================================
    return NextResponse.json({
      ok: true,
      team: {
        tenantId: me.primaryTenantId,
        members: teamMembers.length,
        avgHeat,
        band,
        avgEffectiveness,
        topEmotions,
      },
      byContext: contextStats,
      ranking,
      updatedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[/api/affinity/dashboard/team] Error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✅ Export final del runtime
========================================================= */
export const dynamic = "force-dynamic";
export const preferredRegion = "auto";