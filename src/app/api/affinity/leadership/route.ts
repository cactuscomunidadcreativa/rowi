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
 * 🧭 LEADERSHIP AFFINITY
 * ---------------------------------------------------------
 * Calcula afinidad emocional en el contexto de liderazgo:
 * - Combina growth, collaboration y understanding.
 * - Aplica sinergia de talentos (influencia, visión, colaboración).
 * - Ajusta por dispersión (liderazgo penaliza la inconsistencia).
 * - IA contextual: solo disponible para plan Pro o ?force=1.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const memberId = url.searchParams.get("memberId");
    const force = url.searchParams.get("force") === "1";
    const project = "leadership";

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
       Soporta tanto CommunityMember como tenant Users (user_xxx)
    ========================================================== */
    let targetUserId: string | null = null;
    let memberCloseness: string | null = "Neutral";
    let memberName: string | null = null;
    let realMemberId: string | null = null; // ID real del CommunityMember para FK

    // Check if this is a tenant user (id starts with "user_")
    if (memberId.startsWith("user_")) {
      const realUserId = memberId.replace("user_", "");
      targetUserId = realUserId;

      // Get user info and check for linked CommunityMember
      const [tenantUser, linkedMember] = await Promise.all([
        prisma.user.findUnique({
          where: { id: realUserId },
          select: { id: true, name: true },
        }),
        prisma.communityMember.findFirst({
          where: { userId: realUserId, tenantId: me.primaryTenantId! },
          select: { id: true, closeness: true, name: true },
        }),
      ]);

      memberName = linkedMember?.name || tenantUser?.name || null;
      memberCloseness = linkedMember?.closeness || "Neutral";
      realMemberId = linkedMember?.id || null;
    } else {
      realMemberId = memberId; // Es un CommunityMember ID directo
    }

    const mySnapWhere: any[] = [{ userId: me.id }];
    if (me.email) mySnapWhere.push({ email: { equals: me.email, mode: "insensitive" } });

    const [mySnap, thSnap] = await Promise.all([
      prisma.eqSnapshot.findFirst({ where: { OR: mySnapWhere }, orderBy: { at: "desc" } }),
      targetUserId
        ? prisma.eqSnapshot.findFirst({
            where: { userId: targetUserId },
            orderBy: { at: "desc" },
          })
        : prisma.eqSnapshot.findFirst({
            where: { memberId },
            orderBy: { at: "desc" },
            include: { member: { select: { closeness: true, name: true } } },
          }),
    ]);

    // Si no hay snapshots completos, intentar devolver datos básicos
    if (!mySnap || !thSnap) {
      // Si tenemos el snapshot del miembro pero no el del usuario, devolver datos básicos
      if (thSnap) {
        const basicHeat = Math.round(((thSnap.K || 0) + (thSnap.C || 0) + (thSnap.G || 0)) / 3);
        const heat100 = Math.round((basicHeat / 135) * 100);
        return NextResponse.json({
          ok: true,
          project,
          memberId,
          member: memberName,
          heat: heat100,
          heat135: basicHeat,
          affinity_level: basicHeat >= 108 ? "Diestro" : basicHeat >= 92 ? "Funcional" : "Emergente",
          band: basicHeat >= 108 ? "hot" : basicHeat >= 92 ? "warm" : "cold",
          ai_summary: "Datos básicos de SEI (falta tu perfil para cálculo completo)",
          basic_only: true,
        });
      }
      return NextResponse.json({ ok: true, items: [] });
    }

    // For regular members, extract data from include
    if (!targetUserId && (thSnap as any).member) {
      memberCloseness = (thSnap as any).member?.closeness || "Neutral";
      memberName = (thSnap as any).member?.name || null;
    }

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
    const { score: growth, growth: growthRaw } = compAffinity135(myComp, thComp, project);
    const tFactor = talentSynergyFactor(project, myTals, thTals);
    const collab = collaboration135(mySnap.brainStyle, thSnap.brainStyle, myComp, thComp, tFactor);
    const understand = understanding135(myOuts, thOuts, project);

    const uPrefs = await learnUserPrefs(me.id);

    // 🔧 Ajustes específicos de liderazgo
    const bias = Math.min(uPrefs.biasFactor, 1.05);
    const calibration = 0.94; // liderazgo necesita mayor precisión (penaliza dispersión)
    const closeAdj = closenessMultiplier(memberCloseness);

    // 🎯 Ponderaciones del contexto liderazgo
    const W = CTX.leadership;

    let composite135 =
      (W.growth * growth + W.collab * collab + W.understand * understand) *
      bias * calibration * closeAdj;

    // 💬 Penalización adicional si hay demasiada dispersión en competencias
    const dispersionKeys = Object.values(myComp).filter((v) => v != null) as number[];
    const dispersionMean =
      dispersionKeys.length > 1
        ? dispersionKeys.reduce((a, b) => a + Math.abs(b - (growthRaw ?? 67.5)), 0) /
          dispersionKeys.length
        : 0;
    const dispersionPenalty = dispersionMean > 15 ? 0.95 : 1.0; // si hay gran dispersión, reduce 5%

    composite135 = clamp(composite135 * dispersionPenalty, 0, 135);

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
       Solo guardar si tenemos un CommunityMember ID real
    ========================================================== */
    if (realMemberId) {
      await prisma.affinitySnapshot.upsert({
        where: {
          userId_memberId_context: { userId: me.id, memberId: realMemberId, context: project },
        },
        update: {
          lastHeat135: Math.round(composite135),
          aiSummary: ai_summary,
          biasFactor: uPrefs.biasFactor,
          closeness: memberCloseness,
        },
        create: {
          userId: me.id,
          memberId: realMemberId,
          context: project,
          lastHeat135: Math.round(composite135),
          aiSummary: ai_summary,
          biasFactor: uPrefs.biasFactor,
          closeness: memberCloseness,
        },
      });
    }

    /* =========================================================
       📦 Calcular talentos y competencias compartidas
    ========================================================== */
    const sharedTalents: string[] = [];
    const complementaryTalents: { yours: string; theirs: string }[] = [];
    Object.keys(myTals).forEach((k) => {
      const my = myTals[k];
      const th = thTals[k];
      if (my && th && my >= 100 && th >= 100) {
        sharedTalents.push(k);
      } else if (my && th && ((my >= 110 && th < 90) || (th >= 110 && my < 90))) {
        complementaryTalents.push({ yours: my >= 110 ? k : "", theirs: th >= 110 ? k : "" });
      }
    });

    const strongCompetencies: string[] = [];
    (["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"] as const).forEach((k) => {
      const my = myComp[k];
      const th = thComp[k];
      if (my && th && my >= 100 && th >= 100) {
        strongCompetencies.push(k);
      }
    });

    /* =========================================================
       📦 Salida final
    ========================================================== */
    return NextResponse.json({
      ok: true,
      project,
      memberId,
      member: memberName,
      connectionType: "leadership",
      heat,
      heat135: Math.round(composite135),
      affinity_level,
      band,
      ai_summary,
      parts: {
        growth: Math.round(growth),
        collaboration: Math.round(collab),
        understanding: Math.round(understand),
      },
      brainStyles: {
        yours: mySnap.brainStyle,
        theirs: thSnap.brainStyle,
        compatibility: Math.round((collab / 135) * 100),
      },
      sharedTalents,
      complementaryTalents: complementaryTalents.filter((t) => t.yours || t.theirs),
      strongCompetencies,
      closeness: memberCloseness,
      style: {
        channel: inferMemberChannel(thSnap).channel,
        tone: uPrefs.toneFactor > 1.0 ? "direct" : "warm",
        detail: uPrefs.detailFactor > 1.02 ? "deep" : "standard",
      },
    });
  } catch (e: any) {
    console.error("leadership route error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}