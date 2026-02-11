// src/app/api/hub/communities/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { contributeBatchToRowiverse, ContributionInput } from "@/lib/rowiverse/contribution-service";

export const runtime = "nodejs";

/* =========================================================
   🧠 HELPERS
========================================================= */
const toInt = (v: any) => {
  if (v === undefined || v === null || v === "") return null;
  const n = parseInt(String(v).replace(/,/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

const toFloat = (v: any) => {
  if (v === undefined || v === null || v === "") return null;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

const safeDate = (v: any) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

/* =========================================================
   🔑 MAPEOS
========================================================= */
const SUBFACTORS: Record<string, string> = {
  "Enhance Emotional Literacy Score": "EL",
  "Recognize Patterns Score": "RP",
  "Apply Consequential Thinking Score": "ACT",
  "Navigate Emotions Score": "NE",
  "Engage Intrinsic Motivation Score": "IM",
  "Excercise Optimism Score": "OP",
  "Increase Empathy Score": "EMP",
  "Pursue Noble Goals Score": "NG",
};

const SUCCESS_FACTORS = [
  "Influence",
  "Decision Making",
  "Community",
  "Network",
  "Achievement",
  "Satisfaction",
  "Balance",
  "Health",
];

const TALENTS = [
  "DataMining",
  "Modeling",
  "Prioritizing",
  "Connection",
  "EmotionalInsight",
  "Collaboration",
  "Reflecting",
  "Adaptability",
  "CriticalThinking",
  "Resilience",
  "RiskTolerance",
  "Imagination",
  "Proactivity",
  "Commitment",
  "ProblemSolving",
  "Vision",
  "Designing",
  "Entrepreneurship",
  "Brain Agility",
];

/* =========================================================
   📥 POST — Importar CSV completo + VINCULAR JERARQUÍA
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Archivo CSV requerido" }, { status: 400 });

    const tenantId = formData.get("tenantId")?.toString() || null;
    const hubId = formData.get("hubId")?.toString() || null;
    const superHubId = formData.get("superHubId")?.toString() || null;
    const organizationId = formData.get("organizationId")?.toString() || null;
    const rowiVerseId = formData.get("rowiVerseId")?.toString() || null;

    const buffer = Buffer.from(await file.arrayBuffer());
    let csvText = buffer.toString("utf8").replace(/^\uFEFF/, "");
    const rows = parse(csvText, { columns: true, skip_empty_lines: true, trim: true });
    if (!rows.length) return NextResponse.json({ error: "CSV vacío" }, { status: 400 });

    /* =========================================================
       1️⃣ Crear o detectar comunidad
    ========================================================== */
    const projectName = (rows[0].Project || "Comunidad sin nombre").trim();
    const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const owner = rows[0].Owner || null;
    const executionTime = toInt(rows[0]["Execution Time"]);
    const language = rows[0]["Items Language"] || null;

    const creator = await prisma.user.findUnique({ where: { email: token.email } });

    let community = await prisma.rowiCommunity.findUnique({ where: { slug } });

    if (!community) {
      community = await prisma.rowiCommunity.create({
        data: {
          name: projectName,
          slug,
          owner: owner || undefined,
          language: language || undefined,
          executionTime: executionTime ?? undefined,
          createdById: creator?.id,
          description: `Comunidad importada automáticamente desde CSV (${projectName})`,
          tenantId,
          hubId,
          superHubId,
          organizationId,
          rowiVerseId,
        },
      });
    }

    /* =========================================================
       2️⃣ Procesar filas
    ========================================================== */
    const stats = {
      usersCreated: 0,
      membersCreated: 0,
      snapshotsCreated: 0,
      competencies: 0,
      subfactors: 0,
      outcomes: 0,
      moods: 0,
      success: 0,
      talents: 0,
      rowiverseContributions: 0,
    };

    // Acumular contribuciones al RowiVerse para batch insert al final
    const rowiverseContributions: ContributionInput[] = [];

    /* =========================================================
       🔁 BUCLE PRINCIPAL — POR CADA FILA DEL CSV
    ========================================================== */
    for (const row of rows) {
      const email = (row.Email || "").trim().toLowerCase();
      if (!email) continue;

      /* =========================================================
         2.1 CREAR/ACTUALIZAR USUARIO
      ========================================================== */
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: [row["Test Taker Name"], row["Test Taker Surname"]]
              .filter(Boolean)
              .join(" ")
              .trim() || null,
            active: true,
            country: row["Country"]?.trim() || null,
            language: row["Items Language"]?.trim()?.toLowerCase() || null,
            primaryTenantId: tenantId,
          },
        });
        stats.usersCreated++;
      }

      /* =========================================================
         2.2.1 ASEGURAR ROWIVERSE USER (global identity primero)
      ========================================================== */
      let rowiVerseUser = await prisma.rowiVerseUser.findUnique({
        where: { userId: user.id },
      });

      if (!rowiVerseUser) {
        // Intentar buscar por email también
        rowiVerseUser = await prisma.rowiVerseUser.findUnique({
          where: { email: user.email },
        });
      }

      if (!rowiVerseUser) {
        rowiVerseUser = await prisma.rowiVerseUser.create({
          data: {
            userId: user.id,
            email: user.email,
            name: user.name,
            language: user.language || "es",
            rowiVerseId: rowiVerseId || community.rowiVerseId || null,
            verified: false, // Se verifica cuando reclama su perfil
            active: true,
            status: "pending",
          },
        });
      }

      // Vincular User con RowiVerseUser si no está vinculado
      if (!user.rowiverseId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { rowiverseId: rowiVerseUser.id },
        });
      }

      /* =========================================================
         2.2.2 VINCULAR COMO MIEMBRO DE LA COMUNIDAD
      ========================================================== */
      let communityUser = await prisma.rowiCommunityUser.findFirst({
        where: { communityId: community.id, userId: user.id },
      });

      if (!communityUser) {
        communityUser = await prisma.rowiCommunityUser.create({
          data: {
            userId: user.id,
            communityId: community.id,
            rowiverseUserId: rowiVerseUser.id,
            email: user.email,
            name: user.name,
            role: "member",
            status: "active",
            language: user.language || community.language || "es",
          },
        });
        stats.membersCreated++;
      } else if (!communityUser.rowiverseUserId) {
        // Update existing to link with RowiVerse
        await prisma.rowiCommunityUser.update({
          where: { id: communityUser.id },
          data: { rowiverseUserId: rowiVerseUser.id },
        });
      }

      /* =========================================================
         2.3 CREAR MIEMBRO LEGACY (para compatibilidad)
         email tiene @unique global, buscar primero por email solo
      ========================================================== */
      let legacyMember = await prisma.communityMember.findUnique({
        where: { email },
      });

      if (!legacyMember) {
        legacyMember = await prisma.communityMember.create({
          data: {
            email,
            name: user.name,
            userId: user.id,
            tenantId: tenantId ?? community.tenantId ?? "",
            hubId: hubId ?? community.hubId ?? null,
            rowiverseUserId: rowiVerseUser.id,
            role: "member",
            status: "ACTIVE",
            joinedAt: new Date(),
          },
        });
      } else {
        // Update existing to link with RowiVerse and refresh data
        await prisma.communityMember.update({
          where: { id: legacyMember.id },
          data: {
            rowiverseUserId: legacyMember.rowiverseUserId || rowiVerseUser.id,
            userId: legacyMember.userId || user.id,
            name: user.name || legacyMember.name,
          },
        });
      }

      /* =========================================================
         2.3.2 CREAR SNAPSHOT COMPLETO
      ========================================================== */
      const snapshot = await prisma.eqSnapshot.create({
        data: {
          user: { connect: { id: user.id } },
          member: { connect: { id: legacyMember.id } },
          rowiverseUser: { connect: { id: rowiVerseUser.id } },
          dataset: "SEI",
          project: row.Project || null,
          owner: row.Owner || null,
          country: row.Country || null,
          email,
          jobFunction: row["Job Function"] || null,
          jobRole: row["Job Role"] || null,
          sector: row.Sector || null,
          age: toInt(row.Age),
          gender: row.Gender || null,
          education: row.Education || null,
          phone: row.Phone || null,
          context: row["Items Language"] || null,
          at: safeDate(row.Date) || new Date(),
          K: toInt(row["Know Yourself Score"]),
          C: toInt(row["Choose Yourself Score"]),
          G: toInt(row["Give Yourself Score"]),
          EL: toInt(row["Enhance Emotional Literacy Score"]),
          RP: toInt(row["Recognize Patterns Score"]),
          ACT: toInt(row["Apply Consequential Thinking Score"]),
          NE: toInt(row["Navigate Emotions Score"]),
          IM: toInt(row["Engage Intrinsic Motivation Score"]),
          OP: toInt(row["Excercise Optimism Score"]),
          EMP: toInt(row["Increase Empathy Score"]),
          NG: toInt(row["Pursue Noble Goals Score"]),
          brainStyle: row["Profile"] || null,
          overall4: toFloat(row["Overall 4 Outcome"]),
          recentMood: row["Recent Mood"] || null,
          moodIntensity: row["Intensity"] ? String(row["Intensity"]) : null,
          reliabilityIndex: toFloat(row["Reliability Index"]),
          positiveImpressionScore: toFloat(row["Positive Impression Score"]),
          positiveImpressionRange: row["Positive Impression Range"] || null,
          executionTimeRange: row["Execution Time Range"] || null,
          randomIndex: toFloat(row["Random Index"]),
          densityIndex: toFloat(row["Density Index"]),
          answerStyle: row["AnswerStyle"] || null,
          normFactorComplement: toFloat(row["NormFactorComplement"]),
          consistencyOutput: toFloat(row["ConsistencyOutput"]),
        },
      });

      stats.snapshotsCreated++;

      /* =========================================================
         2.3.3.1 PREPARAR CONTRIBUCIÓN AL ROWIVERSE
      ========================================================== */
      // Solo agregar si el usuario tiene habilitada la contribución (default: true)
      if (user.contributeToRowiverse !== false) {
        rowiverseContributions.push({
          userId: user.id,
          memberId: legacyMember.id,
          tenantId: tenantId || community.tenantId || undefined,
          sourceType: "csv_upload",
          sourceId: snapshot.id,
          eqData: {
            eqTotal: toFloat(row["Know Yourself Score"]) && toFloat(row["Choose Yourself Score"]) && toFloat(row["Give Yourself Score"])
              ? Math.round(((toFloat(row["Know Yourself Score"]) || 0) + (toFloat(row["Choose Yourself Score"]) || 0) + (toFloat(row["Give Yourself Score"]) || 0)) / 3)
              : null,
            K: toFloat(row["Know Yourself Score"]),
            C: toFloat(row["Choose Yourself Score"]),
            G: toFloat(row["Give Yourself Score"]),
            EL: toFloat(row["Enhance Emotional Literacy Score"]),
            RP: toFloat(row["Recognize Patterns Score"]),
            ACT: toFloat(row["Apply Consequential Thinking Score"]),
            NE: toFloat(row["Navigate Emotions Score"]),
            IM: toFloat(row["Engage Intrinsic Motivation Score"]),
            OP: toFloat(row["Excercise Optimism Score"]),
            EMP: toFloat(row["Increase Empathy Score"]),
            NG: toFloat(row["Pursue Noble Goals Score"]),
          },
          demographics: {
            country: row.Country || null,
            region: null,
            sector: row.Sector || null,
            jobFunction: row["Job Function"] || null,
            jobRole: row["Job Role"] || null,
            ageRange: row.Age ? `${row.Age}` : null,
            gender: row.Gender || null,
            education: row.Education || null,
          },
          outcomes: {
            effectiveness: toFloat(row["Effectiveness"]),
            relationships: toFloat(row["Relationship"]),
            qualityOfLife: toFloat(row["Quality of Life"]),
            wellbeing: toFloat(row["Wellbeing"]),
            influence: toFloat(row["Influence"]),
            decisionMaking: toFloat(row["Decision Making"]),
            community: toFloat(row["Community"]),
            health: toFloat(row["Health"]),
          },
          brainTalents: {
            dataMining: toFloat(row["DataMining"]),
            modeling: toFloat(row["Modeling"]),
            prioritizing: toFloat(row["Prioritizing"]),
            connection: toFloat(row["Connection"]),
            emotionalInsight: toFloat(row["EmotionalInsight"]),
            collaboration: toFloat(row["Collaboration"]),
            reflecting: toFloat(row["Reflecting"]),
            adaptability: toFloat(row["Adaptability"]),
            criticalThinking: toFloat(row["CriticalThinking"]),
            resilience: toFloat(row["Resilience"]),
            riskTolerance: toFloat(row["RiskTolerance"]),
            imagination: toFloat(row["Imagination"]),
            proactivity: toFloat(row["Proactivity"]),
            commitment: toFloat(row["Commitment"]),
            problemSolving: toFloat(row["ProblemSolving"]),
            vision: toFloat(row["Vision"]),
            designing: toFloat(row["Designing"]),
            entrepreneurship: toFloat(row["Entrepreneurship"]),
            brainAgility: toFloat(row["Brain Agility"]),
          },
        });
      }

      /* =========================================================
         2.3.4 RECALCULAR AFINIDAD
      ========================================================== */
      try {
        const { autoRecalcAffinity } = await import(
          "@/ai/learning/affinityAutoRecalc"
        );
        await autoRecalcAffinity({
          userId: user.id,
          context: "import-csv",
          force: true,
        });
      } catch (err: any) {
        console.warn("⚠️ No se pudo recalcular affinity para", user.email, err);
      }
      
      /* =========================================================
         2.3.5 (REMOVIDO) — No existe RowiVerseSyncLog en el schema
      ========================================================== */

      /* =========================================================
         2.4 COMPETENCIAS / SUBFACTORES / OUTCOMES / TALENTS
      ========================================================== */
      // COMPETENCIAS
      for (const c of [
        { key: "K", label: "Know Yourself", value: toFloat(row["Know Yourself Score"]) },
        { key: "C", label: "Choose Yourself", value: toFloat(row["Choose Yourself Score"]) },
        { key: "G", label: "Give Yourself", value: toFloat(row["Give Yourself Score"]) },
      ]) {
        if (c.value != null) {
          await prisma.eqCompetencySnapshot.create({
            data: { snapshotId: snapshot.id, key: c.key, label: c.label, score: c.value },
          });
        }
        stats.competencies++;
      }

      // SUBFACTORES
      for (const label in SUBFACTORS) {
        const val = toFloat(row[label]);
        if (val != null) {
          await prisma.eqSubfactorSnapshot.create({
            data: { snapshotId: snapshot.id, key: SUBFACTORS[label], label, score: val },
          });
        }
        stats.subfactors++;
      }

      // OUTCOMES
      for (const o of [
        { key: "Effectiveness", label: "Effectiveness", value: toFloat(row["Effectiveness"]) },
        { key: "Relationship", label: "Relationship", value: toFloat(row["Relationship"]) },
        { key: "QualityOfLife", label: "Quality of Life", value: toFloat(row["Quality of Life"]) },
        { key: "Wellbeing", label: "Wellbeing", value: toFloat(row["Wellbeing"]) },
        { key: "Overall4", label: "Overall 4 Outcome", value: toFloat(row["Overall 4 Outcome"]) },
      ]) {
        if (o.value != null) {
          await prisma.eqOutcomeSnapshot.create({
            data: { snapshotId: snapshot.id, key: o.key, label: o.label, score: o.value },
          });
        }
        stats.outcomes++;
      }

      // SUCCESS FACTORS
      for (const key of SUCCESS_FACTORS) {
        const val = toFloat(row[key]);
        if (val != null) {
          await prisma.eqSuccessFactorSnapshot.create({
            data: { snapshotId: snapshot.id, key, label: key, score: val },
          });
        }
        stats.success++;
      }

      // TALENTS
      for (const key of TALENTS) {
        const val = toFloat(row[key]);
        if (val != null) {
          await prisma.talentSnapshot.create({
            data: { snapshotId: snapshot.id, key, label: key, score: val },
          });
        }
        stats.talents++;
      }

    } // ←←← CIERRE CORRECTO DEL FOR PRINCIPAL

    /* =========================================================
       3️⃣ CONTRIBUIR AL ROWIVERSE EN BATCH
    ========================================================== */
    if (rowiverseContributions.length > 0) {
      try {
        const rowiverseResult = await contributeBatchToRowiverse(rowiverseContributions);
        stats.rowiverseContributions = rowiverseResult.processed;
        console.log(`🌐 RowiVerse: ${rowiverseResult.processed} contribuciones procesadas`);
      } catch (err) {
        console.warn("⚠️ Error al contribuir al RowiVerse:", err);
      }
    }

    /* =========================================================
       📦 RESPUESTA FINAL
    ========================================================== */
    return NextResponse.json({
      ok: true,
      community: { id: community.id, name: community.name },
      summary: { ...stats, totalRows: rows.length },
    });

  } catch (err: any) {
    console.error("❌ Error import-full:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}