import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";
import {
  N, clamp, to100, seiLevel135,
  compAffinity135, collaboration135,
  understanding135, talentSynergyFactor,
  learnUserPrefs, generateAiAdvice,
  normCloseness, closenessMultiplier,
  inferMemberChannel, CTX,
} from "../utils";

export const runtime = "nodejs";

/**
 * ⚙️ EXECUTION AFFINITY
 * ---------------------------------------------------------
 * Evalúa la afinidad en el contexto de ejecución:
 * - Foco en disciplina, priorización, organización y acción.
 * - Alta ponderación en growth (competencias ACT, RP, NE).
 * - Sinergia de talentos (prioritizing, problemSolving, commitment).
 * - IA contextual para feedback de desempeño (solo Pro o ?force=1).
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const memberId = url.searchParams.get("memberId");
    const force = url.searchParams.get("force") === "1";
    const project = "execution";

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
       👤 Snapshots base
    ========================================================== */
    const [mySnap, thSnapWithMember] = await Promise.all([
      prisma.eqSnapshot.findFirst({ where: { userId: me.id }, orderBy: { at: "desc" } }),
      prisma.eqSnapshot.findFirst({
        where: { memberId },
        orderBy: { at: "desc" },
        include: { member: { select: { closeness: true, name: true } } }
      }),
    ]);
    if (!mySnap || !thSnapWithMember)
      return NextResponse.json({ ok: true, items: [] });
    const thSnap = thSnapWithMember;
    const memberCloseness = thSnapWithMember.member?.closeness;
    const memberName = thSnapWithMember.member?.name;

    /* =========================================================
       🧩 Data complementaria
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

    // 🔧 Ajustes específicos del contexto ejecución
    const bias = Math.min(uPrefs.biasFactor, 1.07); // ejecución permite más margen de sesgo positivo
    const calibration = 0.90; // mayor peso en eficiencia que en empatía
    const closeAdj = closenessMultiplier(memberCloseness);

    // ⚙️ Ponderaciones del contexto execution
    const W = CTX.execution;

    let composite135 =
      (W.growth * growth + W.collab * collab + W.understand * understand) *
      bias * calibration * closeAdj;

    // 💬 Bonus por alineación en talentos de acción
    const keyTalents = ["prioritizing", "commitment", "problemSolving"];
    const sharedTalents = keyTalents.filter(
      (t) => (N(myTals[t]) ?? 0) >= 108 && (N(thTals[t]) ?? 0) >= 108
    );
    if (sharedTalents.length >= 2) composite135 *= 1.04; // pequeño boost de +4%

    composite135 = clamp(composite135, 0, 135);
    const heat = to100(composite135);
    const affinity_level = seiLevel135(composite135);
    const band = composite135 >= 108 ? "hot" : composite135 >= 92 ? "warm" : "cold";

    /* =========================================================
       💬 IA contextual (solo Pro o ?force=1)
    ========================================================== */
    let ai_summary = "ℹ️ Afinidad numérica calculada (modo ahorro IA).";
    if (me.plan?.name === "pro" || force) {
      ai_summary = await generateAiAdvice({
        locale: "es",
        aName: me.name || "Tú",
        bName: memberName || "Miembro",
        context: project,
      });
    }

    /* =========================================================
       💾 Guardar snapshot
    ========================================================== */
    await prisma.affinitySnapshot.upsert({
      where: {
        userId_memberId_context: { userId: me.id, memberId, context: project },
      },
      update: {
        lastHeat135: Math.round(composite135),
        aiSummary: ai_summary,
        biasFactor: uPrefs.biasFactor,
        closeness: memberCloseness,
      },
      create: {
        userId: me.id,
        memberId,
        context: project,
        lastHeat135: Math.round(composite135),
        aiSummary: ai_summary,
        biasFactor: uPrefs.biasFactor,
        closeness: memberCloseness,
      },
    });

    /* =========================================================
       📦 Salida final
    ========================================================== */
    return NextResponse.json({
      ok: true,
      project,
      memberId,
      heat,
      affinity_level,
      band,
      ai_summary,
      style: {
        channel: inferMemberChannel(thSnap).channel,
        tone: uPrefs.toneFactor > 1.0 ? "direct" : "warm",
        detail: uPrefs.detailFactor > 1.02 ? "deep" : "standard",
      },
    });
  } catch (e: any) {
    console.error("execution route error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}