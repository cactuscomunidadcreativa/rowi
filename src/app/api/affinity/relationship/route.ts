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
import { persistHeat135ToDyad } from "@/ai/learning/affinityLearning";

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
       Soporta tanto CommunityMember como tenant Users (user_xxx)
    ========================================================== */
    let member: {
      id: string;
      name: string | null;
      closeness: string | null;
      connectionType: string | null;
      brainStyle: string | null;
      group: string | null;
      country: string | null;
    } | null = null;
    let targetUserId: string | null = null; // Para buscar eqSnapshot del tenant user

    // Check if this is a tenant user (id starts with "user_")
    if (memberId.startsWith("user_")) {
      const realUserId = memberId.replace("user_", "");
      targetUserId = realUserId;

      // First check if there's a CommunityMember linked to this user
      const linkedMember = await prisma.communityMember.findFirst({
        where: {
          userId: realUserId,
          tenantId: me.primaryTenantId!,
        },
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

      if (linkedMember) {
        member = linkedMember;
      } else {
        // Fall back to User data
        const tenantUser = await prisma.user.findUnique({
          where: { id: realUserId },
          select: {
            id: true,
            name: true,
            country: true,
            eqSnapshots: {
              orderBy: { at: "desc" },
              take: 1,
              select: { brainStyle: true },
            },
          },
        });

        if (tenantUser) {
          member = {
            id: memberId,
            name: tenantUser.name,
            closeness: "Neutral",
            connectionType: "teammate",
            brainStyle: tenantUser.eqSnapshots?.[0]?.brainStyle || null,
            group: "Trabajo",
            country: tenantUser.country,
          };
        }
      }
    } else {
      // Regular CommunityMember lookup
      member = await prisma.communityMember.findUnique({
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
    }

    if (!member)
      return NextResponse.json({ ok: false, error: "Miembro no encontrado" });

    /* =========================================================
       👤 Snapshots base (usuario y miembro)
       Busca por userId O email para cubrir multi-account
    ========================================================== */
    const mySnapWhere: any[] = [{ userId: me.id }];
    if (me.email) mySnapWhere.push({ email: { equals: me.email, mode: "insensitive" } });

    const [mySnap, thSnap] = await Promise.all([
      prisma.eqSnapshot.findFirst({
        where: { OR: mySnapWhere },
        orderBy: { at: "desc" },
      }),
      targetUserId
        ? prisma.eqSnapshot.findFirst({
            where: { userId: targetUserId },
            orderBy: { at: "desc" },
          })
        : prisma.eqSnapshot.findFirst({
            where: { memberId },
            orderBy: { at: "desc" },
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
          member: member?.name,
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
        tenantId: me.primaryTenantId || "six-seconds-global",
        plan: me.plan?.name,
        payload: {
          aName: me.name || "Tú",
          bNames: [member.name],
          context: member.connectionType || "Relación",
          summary: { heat, affinity_level, band },
        },
      });
      // Some agent paths return a raw string, others wrap as { answer, ... }.
      // Normalize to string for the column.
      ai_summary =
        (typeof result === "string"
          ? result
          : (result as any)?.answer) ||
        "Relación analizada con IA: conexión emocional, colaboración y entendimiento evaluados.";
    }

    /* =========================================================
       💾 Guardar snapshot de afinidad
       Solo guardar si tenemos un CommunityMember ID real (no prefijo user_)
    ========================================================== */
    if (!member.id.startsWith("user_")) {
      await prisma.affinitySnapshot.upsert({
        where: {
          userId_memberId_context: { userId: me.id, memberId: member.id, context: project },
        },
        update: {
          lastHeat135: Math.round(finalScore),
          aiSummary: ai_summary,
          biasFactor: uPrefs.biasFactor,
          closeness: member.closeness,
        },
        create: {
          userId: me.id,
          memberId: member.id,
          context: project,
          lastHeat135: Math.round(finalScore),
          aiSummary: ai_summary,
          biasFactor: uPrefs.biasFactor,
          closeness: member.closeness,
        },
      });
    }

    // Persistir la sintonía en la díada → ECO sale de modo neutro (resiliente).
    await persistHeat135ToDyad({ ownerUserId: me.id, memberId, context: project, heat135: finalScore });

    /* =========================================================
       📦 Salida final con detalles completos
    ========================================================== */
    // Encontrar talentos en común (ambos >= 100)
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

    // Competencias fuertes en común
    const strongCompetencies: string[] = [];
    (["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"] as const).forEach((k) => {
      const my = myComp[k];
      const th = thComp[k];
      if (my && th && my >= 100 && th >= 100) {
        strongCompetencies.push(k);
      }
    });

    return NextResponse.json({
      ok: true,
      project,
      memberId,
      member: member.name,
      connectionType: member.connectionType,
      heat,
      heat135: Math.round(finalScore),
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
      closeness: member.closeness,
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
export const preferredRegion = "iad1";