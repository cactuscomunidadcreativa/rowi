import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";
import {
  N, clamp, to100, seiLevel135,
  compAffinity135, collaboration135,
  understanding135, talentSynergyFactor,
  learnUserPrefs, normCloseness, closenessMultiplier,
  inferMemberChannel, CTX,
} from "../utils";
import { runAffinityRouter } from "@/ai/agents/affinity/router"; // ✅ subrouter IA

export const runtime = "nodejs";

/**
 * 💞 RELATIONSHIP AFFINITY (v2.3)
 * ---------------------------------------------------------
 * Calcula la afinidad entre el usuario (A) y un miembro (B),
 * integrando competencias, talentos, outcomes y estilo cerebral.
 * - Si el plan es "pro" o force=1 → usa IA contextual (subrouter Affinity)
 * - Si no, genera resumen básico sin IA
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const memberId = url.searchParams.get("memberId");
    const force = url.searchParams.get("force") === "1";
    const project = "relationship";

    const auth = await getServerAuthUser();
    if (!auth?.email)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const me = await prisma.user.findUnique({
      where: { email: auth.email },
      include: { plan: { select: { name: true } } }
    });
    if (!me || !memberId)
      return NextResponse.json({ ok: false, error: "Missing data" }, { status: 400 });

    /* =========================================================
       👥 Validar miembro asociado
    ========================================================== */
    const member = await prisma.communityMember.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        closeness: true,
        connectionType: true,
        brainStyle: true,
        group: true,
        country: true,
      },
    });
    if (!member)
      return NextResponse.json({ ok: false, error: "Miembro no encontrado" });

    /* =========================================================
       👤 Snapshots base (usuario y miembro)
    ========================================================== */
    const [mySnap, thSnap] = await Promise.all([
      prisma.eqSnapshot.findFirst({
        where: { userId: me.id },
        orderBy: { at: "desc" },
      }),
      prisma.eqSnapshot.findFirst({
        where: { memberId },
        orderBy: { at: "desc" },
      }),
    ]);
    if (!mySnap || !thSnap)
      return NextResponse.json({ ok: true, items: [] });

    /* =========================================================
       🧩 Datos adicionales: outcomes + talentos
    ========================================================== */
    const [myOuts, thOuts, myTalsRows, thTalsRows] = await Promise.all([
      prisma.eqOutcomeSnapshot.findMany({ where: { snapshotId: mySnap.id } }),
      prisma.eqOutcomeSnapshot.findMany({ where: { snapshotId: thSnap.id } }),
      prisma.talentSnapshot.findMany({ where: { snapshotId: mySnap.id } }),
      prisma.talentSnapshot.findMany({ where: { snapshotId: thSnap.id } }),
    ]);

    const myTals: Record<string, number | null> = {};
    const thTals: Record<string, number | null> = {};
    myTalsRows.forEach((t) => (myTals[t.key] = N(t.score)));
    thTalsRows.forEach((t) => (thTals[t.key] = N(t.score)));

    const myComp = {
      EL: N(mySnap.EL), RP: N(mySnap.RP), ACT: N(mySnap.ACT),
      NE: N(mySnap.NE), IM: N(mySnap.IM), OP: N(mySnap.OP),
      EMP: N(mySnap.EMP), NG: N(mySnap.NG),
    };
    const thComp = {
      EL: N(thSnap.EL), RP: N(thSnap.RP), ACT: N(thSnap.ACT),
      NE: N(thSnap.NE), IM: N(thSnap.IM), OP: N(thSnap.OP),
      EMP: N(thSnap.EMP), NG: N(thSnap.NG),
    };

    /* =========================================================
       🧠 Cálculos principales
    ========================================================== */
    const { score: growth } = compAffinity135(myComp, thComp, project);
    const tFactor = talentSynergyFactor(project, myTals, thTals);
    const collab = collaboration135(mySnap.brainStyle, thSnap.brainStyle, myComp, thComp, tFactor);
    const understand = understanding135(myOuts, thOuts, project);

    const uPrefs = await learnUserPrefs(me.id);
    const bias = Math.min(uPrefs.biasFactor, 1.05);
    const calibration = 0.92;
    const closeAdj = closenessMultiplier(member.closeness);

    const W = CTX.relationship;
    const composite135 =
      (W.growth * growth + W.collab * collab + W.understand * understand) *
      bias * calibration * closeAdj;

    const finalScore = clamp(composite135, 0, 135);
    const heat = to100(finalScore);
    const affinity_level = seiLevel135(finalScore);
    const band = finalScore >= 108 ? "hot" : finalScore >= 92 ? "warm" : "cold";

    /* =========================================================
       💬 IA contextual (solo Pro o ?force=1)
       Usa el router interno de agentes (Affinity:relationship)
    ========================================================== */
    let ai_summary = "ℹ️ Afinidad numérica calculada (modo ahorro IA).";
    if (me.plan?.name === "pro" || force) {
      const result = await runAffinityRouter({
        subIntent: "relationship",
        locale: "es",
        tenantId: me.primaryTenantId || "rowi-master",
        plan: me.plan?.name,
        payload: {
          aName: me.name || "Tú",
          bNames: [member.name],
          context: member.connectionType || "Relación",
          summary: { heat, affinity_level, band },
        },
      });
      ai_summary =
        result?.answer ||
        "Relación analizada con IA: conexión emocional, colaboración y entendimiento evaluados.";
    }

    /* =========================================================
       💾 Guardar snapshot de afinidad
    ========================================================== */
    await prisma.affinitySnapshot.upsert({
      where: {
        userId_memberId_context: { userId: me.id, memberId, context: project },
      },
      update: {
        lastHeat135: Math.round(finalScore),
        aiSummary: ai_summary,
        biasFactor: uPrefs.biasFactor,
        closeness: member.closeness,
      },
      create: {
        userId: me.id,
        memberId,
        context: project,
        lastHeat135: Math.round(finalScore),
        aiSummary: ai_summary,
        biasFactor: uPrefs.biasFactor,
        closeness: member.closeness,
      },
    });

    /* =========================================================
       📦 Salida final
    ========================================================== */
    return NextResponse.json({
      ok: true,
      project,
      memberId,
      member: member.name,
      connectionType: member.connectionType,
      heat,
      affinity_level,
      band,
      ai_summary,
      style: {
        channel: inferMemberChannel(thSnap).channel,
        tone: uPrefs.toneFactor > 1.0 ? "directo" : "cálido",
        detail: uPrefs.detailFactor > 1.02 ? "profundo" : "breve",
      },
    });
  } catch (e: any) {
    console.error("❌ [/api/affinity/relationship] Error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

/* =========================================================
   ⚙️ Configuración runtime
========================================================= */
export const dynamic = "force-dynamic";
export const preferredRegion = "auto";