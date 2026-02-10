// src/app/api/eq/me/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

/* Helpers */
function avg(nums: Array<number | null | undefined>) {
  const xs = nums.filter((n): n is number => typeof n === "number");
  return xs.length
    ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10
    : null;
}

/* Cluster map */
const CLUSTER_MAP: Record<string, "focus" | "decisions" | "drive"> = {
  datamining: "focus",
  modeling: "focus",
  prioritizing: "focus",
  connection: "focus",
  emotionalinsight: "focus",
  collaboration: "focus",

  reflecting: "decisions",
  adaptability: "decisions",
  criticalthinking: "decisions",
  resilience: "decisions",
  risktolerance: "decisions",
  imagination: "decisions",

  proactivity: "drive",
  commitment: "drive",
  problemsolving: "drive",
  vision: "drive",
  designing: "drive",
  entrepreneurship: "drive",
  brainagility: "drive",
};

export async function GET(req: NextRequest) {
  try {
    /* 1️⃣ Usuario */
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json({
        source: "db",
        user: { name: "", email },
        eq: {},
        outcomes: {},
        success: [],
      });

    /* 2️⃣ Buscar CommunityMembers del usuario */
    const members = await prisma.communityMember.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    /* 2b️⃣ Buscar RowiVerseUser del usuario */
    const rvUser = await prisma.rowiVerseUser.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    /* 3️⃣ Seleccionar snapshot REAL — buscar por TODAS las vías posibles */
    const snapshotWhere: any[] = [];
    if (members.length > 0) {
      snapshotWhere.push({ memberId: { in: members.map((m) => m.id) } });
    }
    if (rvUser) {
      snapshotWhere.push({ rowiverseUserId: rvUser.id });
    }
    snapshotWhere.push({ userId: user.id });

    /* 3b️⃣ Buscar los 2 snapshots más recientes (actual + anterior = ghost) */
    const recentSnaps = await prisma.eqSnapshot.findMany({
      where: { OR: snapshotWhere },
      orderBy: { at: "desc" },
      take: 2,
    });

    const snap = recentSnaps[0] ?? null;
    const prevSnap = recentSnaps[1] ?? null;

    if (!snap) {
      return NextResponse.json({
        source: "db",
        user: { name: user.name ?? "", email: user.email ?? "" },
        eq: {},
        outcomes: {},
        success: [],
      });
    }

    /* 5️⃣ Cargar datasets vinculados al snapshot actual */
    const [outs, subfactors, talents, successFactors] = await Promise.all([
      prisma.eqOutcomeSnapshot.findMany({ where: { snapshotId: snap.id } }),
      prisma.eqSubfactorSnapshot.findMany({ where: { snapshotId: snap.id } }),
      prisma.talentSnapshot.findMany({ where: { snapshotId: snap.id } }),
      prisma.eqSuccessFactorSnapshot.findMany({ where: { snapshotId: snap.id } }),
    ]);

    /* 5b️⃣ Si hay snapshot anterior, cargar sus outcomes para ghost */
    let prevOuts: typeof outs = [];
    let prevSuccessFactors: typeof successFactors = [];
    if (prevSnap) {
      [prevOuts, prevSuccessFactors] = await Promise.all([
        prisma.eqOutcomeSnapshot.findMany({ where: { snapshotId: prevSnap.id } }),
        prisma.eqSuccessFactorSnapshot.findMany({ where: { snapshotId: prevSnap.id } }),
      ]);
    }

    /* 6️⃣ Competencias SEI */
    const competencias = {
      EL: snap.EL,
      RP: snap.RP,
      ACT: snap.ACT,
      NE: snap.NE,
      IM: snap.IM,
      OP: snap.OP,
      EMP: snap.EMP,
      NG: snap.NG,
    };

    /* 7️⃣ K • C • G */
    const pursuits = {
      know: snap.K,
      choose: snap.C,
      give: snap.G,
    };

    const overall4 = snap.overall4;
    const total = overall4 ?? avg([snap.K, snap.C, snap.G]);

    /* 8️⃣ Mood */
    const mood = {
      recentText: snap.recentMood ?? "Neutral",
      recentEmoji: "🙂",
      intensity: snap.moodIntensity ?? null,
    };

    if (typeof mood.intensity === "string") {
      const i = mood.intensity.toLowerCase();
      if (i.includes("feliz") || i.includes("seguro")) mood.recentEmoji = "😊";
      else if (i.includes("vigilante") || i.includes("interesado")) mood.recentEmoji = "👀";
      else if (i.includes("tranquilo")) mood.recentEmoji = "😌";
    }

    /* 9️⃣ Talentos */
    const talentsByCluster = { focus: {}, decisions: {}, drive: {} };

    talents.forEach((t) => {
      const key = t.key.replace(/\s+/g, "").toLowerCase();
      const cluster = CLUSTER_MAP[key] ?? "focus";
      talentsByCluster[cluster][t.key] = t.score ?? null;
    });

    /* 🔟 SUCCESS FACTORS → AHORA SÍ REAL */
    const success = successFactors.map((s) => ({
      key: s.key,
      score: s.score,
    }));

    /* 1️⃣1️⃣ Outcomes */
    const getOutcome = (label: string) =>
      outs.find((o) => o.label.toLowerCase() === label.toLowerCase())?.score ??
      null;

    const getSF = (label: string) =>
      success.find((s) => s.key.toLowerCase() === label.toLowerCase())?.score ??
      null;

    const outcomes = {
      overall4,
      effectiveness: {
        score: getOutcome("Effectiveness"),
        influence: getSF("Influence"),
        decisionMaking: getSF("Decision Making"),
      },
      relationships: {
        score: getOutcome("Relationship"),
        community: getSF("Community"),
        network: getSF("Network"),
      },
      wellbeing: {
        score: getOutcome("Wellbeing"),
        balance: getSF("Balance"),
        health: getSF("Health"),
      },
      qualityOfLife: {
        score: getOutcome("Quality of Life"),
        achievement: getSF("Achievement"),
        satisfaction: getSF("Satisfaction"),
      },
      subfactors: subfactors.map((s) => ({ key: s.label, score: s.score })),
    };

    /* 1️⃣2️⃣ Signals for Rowi level */
    const hasSEI = snap !== null && (snap.K != null || snap.C != null || snap.G != null);
    const hasProfile = user.name != null && user.name.length > 0;

    // Count coach sessions (from RowiChat)
    const coachSessionCount = await prisma.rowiChat.count({
      where: { userId: user.id },
    });

    /* 1️⃣3️⃣ Ghost / Previous snapshot data */
    let previous: any = null;
    if (prevSnap) {
      const prevTotal = prevSnap.overall4 ?? avg([prevSnap.K, prevSnap.C, prevSnap.G]);
      const getPrevOutcome = (label: string) =>
        prevOuts.find((o) => o.label.toLowerCase() === label.toLowerCase())?.score ?? null;
      const getPrevSF = (label: string) =>
        prevSuccessFactors.find((s) => s.key.toLowerCase() === label.toLowerCase())?.score ?? null;

      previous = {
        date: prevSnap.at,
        project: prevSnap.project ?? null,
        eq: {
          total: prevTotal,
          competencias: {
            EL: prevSnap.EL,
            RP: prevSnap.RP,
            ACT: prevSnap.ACT,
            NE: prevSnap.NE,
            IM: prevSnap.IM,
            OP: prevSnap.OP,
            EMP: prevSnap.EMP,
            NG: prevSnap.NG,
          },
          pursuits: {
            know: prevSnap.K,
            choose: prevSnap.C,
            give: prevSnap.G,
          },
        },
        outcomes: {
          overall4: prevSnap.overall4,
          effectiveness: { score: getPrevOutcome("Effectiveness") },
          relationships: { score: getPrevOutcome("Relationship") },
          wellbeing: { score: getPrevOutcome("Wellbeing") },
          qualityOfLife: { score: getPrevOutcome("Quality of Life") },
        },
      };
    }

    /* 1️⃣4️⃣ Response Final */
    return NextResponse.json({
      source: "db",
      user: { name: user.name ?? "", email: user.email ?? "" },
      mood,
      brain: { style: snap.brainStyle ?? null },
      snapshotDate: snap.at,
      snapshotProject: snap.project ?? null,
      eq: {
        total,
        competencias,
        pursuits,
        talents: talentsByCluster,
      },
      outcomes,
      success,
      previous,
      signals: {
        hasSEI,
        hasProfile,
        coachSessions: coachSessionCount,
      },
    });
  } catch (e: any) {
    console.error("❌ /api/eq/me error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno" },
      { status: 500 },
    );
  }
}