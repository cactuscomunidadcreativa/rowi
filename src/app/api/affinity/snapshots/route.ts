import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { runAffinityRouter } from "@/ai/agents/affinity/router"; // ✅ IA opcional

export const runtime = "nodejs";

/* =========================================================
   ⚙️ Utilidades
========================================================= */
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const avg = (xs: Array<number | null>) => {
  const a = xs.filter((v): v is number => typeof v === "number" && !isNaN(v));
  return a.length
    ? Math.round((a.reduce((p, c) => p + c, 0) / a.length) * 10) / 10
    : null;
};
const to100 = (x135: number) => clamp(Math.round((x135 / 135) * 100), 0, 100);
const bandOf = (x: number) =>
  x >= 70 ? "hot" : x >= 45 ? "warm" : "cold";
const levelOf = (h: number) =>
  h >= 118
    ? "Experto"
    : h >= 108
    ? "Diestro"
    : h >= 92
    ? "Funcional"
    : h >= 82
    ? "Emergente"
    : "Desafío";
const DAY = 1000 * 60 * 60 * 24;

/* =========================================================
   🧠 Matriz BBP — Sinergia básica de estilos cerebrales
========================================================= */
const COLL: Record<string, Record<string, number>> = {
  Strategist: { Strategist: 60, Scientist: 95, Guardian: 80, Deliverer: 85, Inventor: 90, Energizer: 85, Sage: 80, Visionary: 92 },
  Scientist:  { Strategist: 95, Scientist: 60, Guardian: 75, Deliverer: 80, Inventor: 85, Energizer: 80, Sage: 75, Visionary: 82 },
  Guardian:   { Strategist: 80, Scientist: 75, Guardian: 60, Deliverer: 70, Inventor: 75, Energizer: 70, Sage: 80, Visionary: 72 },
  Deliverer:  { Strategist: 85, Scientist: 80, Guardian: 70, Deliverer: 60, Inventor: 80, Energizer: 75, Sage: 75, Visionary: 88 },
  Inventor:   { Strategist: 90, Scientist: 85, Guardian: 75, Deliverer: 80, Inventor: 60, Energizer: 85, Sage: 75, Visionary: 78 },
  Energizer:  { Strategist: 85, Scientist: 80, Guardian: 70, Deliverer: 75, Inventor: 85, Energizer: 60, Sage: 75, Visionary: 86 },
  Sage:       { Strategist: 80, Scientist: 75, Guardian: 80, Deliverer: 75, Inventor: 75, Energizer: 75, Sage: 60, Visionary: 78 },
  Visionary:  { Strategist: 92, Scientist: 82, Guardian: 72, Deliverer: 88, Inventor: 78, Energizer: 86, Sage: 78, Visionary: 60 },
};
function collScore(a?: string | null, b?: string | null) {
  if (!a || !b) return 60;
  return COLL[a]?.[b] ?? 60;
}

/* =========================================================
   🧮 Handler principal GET (Resumen global de afinidad)
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase() || null;
    if (!email)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const me = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, plan: true },
    });
    if (!me)
      return NextResponse.json({
        ok: true,
        message: "Sin usuario registrado",
        global: { heat: 0, band: "cold", level: "Desafío", count: 0 },
        byGroup: [],
        byContext: [],
      });

    /* =========================================================
       🕓 Último Batch (control de refresco)
    ========================================================== */
    const latestAffinity = await prisma.batch.findFirst({
      where: { ownerId: me.id, type: "affinity" },
      orderBy: { startedAt: "desc" },
    });

    const lastUpdate = latestAffinity?.startedAt
      ? new Date(latestAffinity.startedAt)
      : null;
    const daysSince = lastUpdate
      ? Math.floor((Date.now() - lastUpdate.getTime()) / DAY)
      : Infinity;
    const shouldRefresh = !latestAffinity || daysSince > 15;

    /* =========================================================
       👥 Cargar miembros
    ========================================================== */
    const members = await prisma.communityMember.findMany({
      where: { ownerId: me.id },
      select: {
        id: true,
        group: true,
        brainStyle: true,
        closeness: true,
        name: true,
      },
      orderBy: { joinedAt: "desc" },
      take: 1000,
    });

    const heats: number[] = [];
    const groups: Record<string, number[]> = {};
    const contexts: Record<string, number[]> = {};

    /* =========================================================
       🔁 Calcular afinidades existentes
    ========================================================== */
    for (const m of members) {
      const affinitySnap = await prisma.affinitySnapshot.findFirst({
        where: { userId: me.id, memberId: m.id },
        orderBy: { updatedAt: "desc" },
      });

      if (affinitySnap && !shouldRefresh) {
        const val = to100(affinitySnap.lastHeat135 ?? 90);
        heats.push(val);

        const g = m.group || "General";
        if (!groups[g]) groups[g] = [];
        groups[g].push(val);

        const ctx = affinitySnap.context || "relationship";
        if (!contexts[ctx]) contexts[ctx] = [];
        contexts[ctx].push(val);
      }
    }

    // Si no hay afinidades calculadas aún
    if (heats.length === 0) {
      return NextResponse.json({
        ok: true,
        empty: true,
        message: "Aún no se han calculado afinidades para tu comunidad.",
        global: { heat: 0, band: "cold", level: "Desafío", count: 0 },
        byGroup: [],
        byContext: [],
      });
    }

    /* =========================================================
       📊 Consolidar resultados
    ========================================================== */
    const globalHeat = avg(heats) ?? 0;
    const globalLevel = levelOf(Math.round((globalHeat * 135) / 100));

    const byGroup = Object.entries(groups).map(([name, arr]) => ({
      name,
      heat: avg(arr) ?? 0,
      band: bandOf(avg(arr) ?? 0),
      level: levelOf(Math.round(((avg(arr) ?? 0) * 135) / 100)),
      count: arr.length,
    }));

    const byContext = Object.entries(contexts).map(([ctx, arr]) => ({
      context: ctx,
      heat: avg(arr) ?? 0,
      band: bandOf(avg(arr) ?? 0),
      level: levelOf(Math.round(((avg(arr) ?? 0) * 135) / 100)),
      count: arr.length,
    }));

    /* =========================================================
       💬 IA opcional — solo para planes Pro o Enterprise
    ========================================================== */
    let interpretation: string | null = null;
    if (["pro", "enterprise"].includes(me.plan)) {
      try {
        const aiRes = await runAffinityRouter({
          subIntent: "community",
          locale: "es",
          tenantId: "rowi-master",
          plan: me.plan,
          payload: {
            summary: {
              global: { heat: globalHeat, level: globalLevel },
              byGroup,
              byContext,
            },
          },
        });
        interpretation = aiRes?.answer || null;
      } catch (err: any) {
        console.warn("⚠️ IA desactivada temporalmente:", err);
      }
    } else {
      interpretation =
        "🔒 Estás en el plan gratuito. Puedes ver todos los datos numéricos, pero las interpretaciones automáticas de IA están disponibles en el plan Pro.";
    }

    /* =========================================================
       💾 Registrar Batch histórico
    ========================================================== */
    await prisma.batch.create({
      data: {
        ownerId: me.id,
        name: "Resumen global de afinidad",
        description: `Analizadas ${heats.length} conexiones. Temperatura media: ${globalHeat}`,
        type: "summary",
        count: heats.length,
        status: "completado",
        startedAt: new Date(),
      },
    });

    /* =========================================================
       🧠 Respuesta final
    ========================================================== */
    return NextResponse.json({
      ok: true,
      refreshed: shouldRefresh,
      global: {
        heat: globalHeat,
        band: bandOf(globalHeat),
        level: globalLevel,
        count: heats.length,
      },
      byGroup,
      byContext,
      interpretation,
      message: `Temperatura emocional promedio ${globalHeat}% (${globalLevel})`,
    });
  } catch (e: any) {
    console.error("❌ [/api/affinity/summary] Error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ⚙️ Configuración runtime
========================================================= */
export const dynamic = "force-dynamic";
export const preferredRegion = "auto";